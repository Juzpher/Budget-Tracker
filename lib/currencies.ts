export const Currencies = [
  {
    value: "PHP",
    label: "₱ Philippine Peso",
    locale: "fil-PH",
  },
  {
    value: "USD",
    label: "$ Dollar",
    locale: "en-US",
  },
  {
    value: "EUR",
    label: "€ Euro",
    locale: "de-DE",
  },
  {
    value: "GBP",
    label: "£ Pound",
    locale: "en-GB",
  },
  {
    value: "JPY",
    label: "¥ Yen",
    locale: "ja-JP",
  },
];

export type Currency = (typeof Currencies)[0];
