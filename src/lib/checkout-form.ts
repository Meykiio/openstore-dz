import type { DeliveryMethod } from "./delivery";

/**
 * The buyer's address form, shared by the checkout page and the order form on
 * the product page, so both send the database the same fields.
 */
export type CheckoutForm = {
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  note: string;
  delivery_method: DeliveryMethod;
  stopdesk_id: string;
  stopdesk_name: string;
};

export const EMPTY_CHECKOUT_FORM: CheckoutForm = {
  customer_name: "",
  phone: "",
  wilaya: "",
  commune: "",
  address: "",
  note: "",
  delivery_method: "home",
  stopdesk_id: "",
  stopdesk_name: "",
};

export function toCustomer(form: CheckoutForm) {
  return {
    customer_name: form.customer_name,
    phone: form.phone,
    wilaya: form.wilaya,
    commune: form.commune || null,
    address: form.address,
    note: form.note || null,
    delivery_method: form.delivery_method,
    stopdesk_id: form.stopdesk_id || null,
    stopdesk_name: form.stopdesk_name || null,
  };
}
