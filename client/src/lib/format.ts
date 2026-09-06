const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export const formatPrice = (value: number) => currency.format(value);
export const formatDate = (iso: string) => dateTime.format(new Date(iso));
