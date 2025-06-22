import axios from 'axios';

interface ExerciseSuggestion {
  name: string;
  description: string;
  youtube_link: string;
  sets_recommended: number;
  reps_recommended: { min: number; max: number };
  rest_recommended: number;
}

interface WorkoutSuggestionParams {
  muscleGroup: string;
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility';
  level: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'mixed';
}

class LlamaService {
  private apiUrl: string;
  constructor() {
    this.apiUrl = 'http://localhost:11434/api/generate'; // Ollama default
  }

  private async safeParseJSON(content: string): Promise<ExerciseSuggestion[]> {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.warn('JSON parse lỗi, đang cố gắng tự động sửa định dạng...');
      const fixedContent = content
        // Sửa "2-5" thành trung bình 3
        .replace(/(\d+)\s*-\s*(\d+)/g, (_, min, max) => {
          const avg = Math.round((parseInt(min) + parseInt(max)) / 2);
          return avg.toString();
        })
        // Sửa "2-4 minutes" thành số giây
        .replace(/(\d+)\s*minutes?/gi, (_, minutes) => {
          return (parseInt(minutes) * 60).toString();
        });
      return JSON.parse(fixedContent);
    }
  }

  async generateWorkoutSuggestion(params: WorkoutSuggestionParams): Promise<ExerciseSuggestion[]> {
    try {
      const { muscleGroup, goal, level, equipment } = params;
      const displayMuscleGroup = muscleGroup;

      console.log(`Đang tạo gợi ý bài tập cho: ${displayMuscleGroup}, Mục tiêu: ${goal}, Cấp độ: ${level}, Thiết bị: ${equipment}`);

      const prompt = `
Bạn là một API server. 
Hãy trả về đúng và duy nhất một JSON Array theo mẫu dưới đây, không thêm bất kỳ văn bản hay lời giải thích nào.

Mẫu JSON cần trả:
[
  {
    "name": "Tên bài tập",
    "description": "Mô tả ngắn về bài tập và cách thực hiện đúng",
    "youtube_link": "ID video YouTube",
    "sets_recommended": số hiệp (2-5),
    "reps_recommended": { "min": số lần tối thiểu, "max": số lần tối đa },
    "rest_recommended": thời gian nghỉ giữa các hiệp (giây)
  }
]

Yêu cầu:
- Đề xuất 3 bài tập phù hợp cho nhóm cơ "${displayMuscleGroup}".
- Mục tiêu tập luyện: "${goal}".
- Trình độ người tập: "${level}".
- Thiết bị sẵn có: "${equipment}".
- Chỉ được trả về JSON đúng định dạng yêu cầu bên trên.
- Không được thêm giải thích, tiêu đề, chú thích hay bất kỳ nội dung thừa nào ngoài JSON Array.
`;

      console.log('Đang gửi yêu cầu đến OpenChat API local...');

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'openchat',  // Sử dụng OpenChat 3.5
          prompt: prompt,
          temperature: 0.1,
          top_p: 0.8,
          max_tokens: 500,
          stream: false
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('Nhận được phản hồi từ OpenChat');

      const content = response.data.response;

      let exercises: ExerciseSuggestion[];
      try {
        exercises = await this.safeParseJSON(content);
      } catch (parseError) {
        console.error('Lỗi khi phân tích JSON từ OpenChat:', parseError);
        console.log('Nội dung phản hồi:', content);
        throw new Error('Định dạng phản hồi không hợp lệ từ OpenChat');
      }

      if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new Error('Kết quả từ OpenChat không hợp lệ hoặc trống');
      }

      // Chuyển youtube_link thành link chuẩn
      exercises.forEach(exercise => {
        if (exercise.youtube_link && !exercise.youtube_link.startsWith('http')) {
          exercise.youtube_link = `https://www.youtube.com/watch?v=${exercise.youtube_link}`;
        }
      });

      return exercises;
    } catch (error) {
      console.error('Lỗi khi gọi OpenChat API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Chi tiết lỗi Axios:', error.response?.data);
      }
      throw new Error('Không thể tạo gợi ý bài tập từ OpenChat. Vui lòng thử lại.');
    }
  }
}

export default new LlamaService();
