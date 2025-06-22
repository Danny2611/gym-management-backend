export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Tách dấu
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/[^\w\-]+/g, '') // Loại bỏ các ký tự không phải chữ, số, và dấu gạch ngang
    .replace(/\-\-+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu gạch ngang
    .replace(/^-+/, '') // Cắt bỏ dấu gạch ngang ở đầu
    .replace(/-+$/, ''); // Cắt bỏ dấu gạch ngang ở cuối
}