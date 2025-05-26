import { Currencies } from "@/lib/currencies";
import { z } from "zod";


//This is the schema for the user settings, it is used to validate the user input for safe validation
export const UpdateCurrencySchema = z.object({
  currency: z.custom((value) => {
    const found = Currencies.find((currency) => currency.value === value); // find the currency
    if (!found) throw new Error(`Invalid currency ${value}`);
    return value;
  }),
});
