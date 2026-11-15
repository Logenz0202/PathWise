type ClassValue = string | false | null | undefined

// Joins Tailwind class lists, skipping empty ones. Lets long class strings be split by concern
// and conditional classes be written inline: cx('p-2 rounded-lg', active && 'bg-primary-50')
export const cx = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ')
