import { formatDzd } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import type { AdminOrder } from "@/lib/admin";
import type { StoreSettings } from "@/lib/queries";

/**
 * One shipping label, laid out like the carriers' own: who sends, who receives,
 * a wilaya number big enough to sort parcels by at a glance, an SD mark for a
 * pickup-office parcel, what is inside, and the cash to collect.
 *
 * The wording is French whatever the dashboard language, because that is what
 * couriers and the carriers' own labels use. Sized in millimetres, so the same
 * label prints true on a 100 x 150 mm thermal printer and in a quarter of an A4.
 */
export function ShippingLabel({
  order,
  settings,
}: {
  order: AdminOrder;
  settings: StoreSettings | null | undefined;
}) {
  const wilaya = WILAYAS.find((w) => w.fr === order.wilaya);
  const pickup = order.delivery_method === "stopdesk";
  const reference = order.public_token.slice(0, 8).toUpperCase();
  const contents = order.order_items
    .map((i) => `${i.product_name}${i.variant_label ? ` ${i.variant_label}` : ""} x${i.quantity}`)
    .join(", ");

  return (
    // Always left to right, whatever the dashboard direction: it is a French document.
    <article className="ship-label" dir="ltr">
      <header className="sl-top">
        <div className="sl-from">
          {settings?.logo_url && <img src={settings.logo_url} alt="" className="sl-logo" />}
          <p className="sl-k">Expéditeur</p>
          <p className="sl-strong">{settings?.name}</p>
          {settings?.address_fr || settings?.address ? (
            <p>{settings?.address_fr ?? settings?.address}</p>
          ) : null}
          <p dir="ltr">{settings?.phone}</p>
        </div>
        <div className="sl-dest">
          {pickup && <span className="sl-sd">SD</span>}
          <span className="sl-code">{wilaya ? String(wilaya.code).padStart(2, "0") : "--"}</span>
          <span className="sl-place">{order.wilaya}</span>
          {order.commune && <span className="sl-place">{order.commune}</span>}
        </div>
      </header>

      <section className="sl-to">
        <p className="sl-k">Destinataire</p>
        <p className="sl-strong">{order.customer_name}</p>
        <p className="sl-phone" dir="ltr">
          {order.phone}
        </p>
        {pickup ? (
          <p className="sl-strong">Retrait : {order.stopdesk_name ?? "bureau à confirmer"}</p>
        ) : (
          <p>{order.address}</p>
        )}
      </section>

      <section className="sl-ref">
        <span dir="ltr">#{reference}</span>
        {order.tracking_number && (
          <span className="sl-tracking" dir="ltr">
            {order.tracking_number}
          </span>
        )}
      </section>

      <table className="sl-table">
        <thead>
          <tr>
            <th>Description du contenu</th>
            <th>À encaisser</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{contents}</td>
            <td className="sl-amount" dir="ltr">
              {formatDzd(order.total, "fr")}
            </td>
          </tr>
        </tbody>
      </table>

      <footer className="sl-foot">
        <span>Le {new Date(order.created_at).toLocaleDateString("fr-DZ")}</span>
        {order.note && <span className="sl-note">{order.note}</span>}
      </footer>
    </article>
  );
}
