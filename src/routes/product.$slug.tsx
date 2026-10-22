import { createFileRoute, notFound } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { ProductDetail } from "@/components/storefront/product-detail";
import { SizeGuide } from "@/components/storefront/size-guide";
import { ReviewForm, ReviewList } from "@/components/storefront/reviews";
import { ErrorState } from "@/components/ui/feedback";
import { productQuery, reviewsQuery, useProduct } from "@/lib/queries";
import { sizeGuidesQuery } from "@/lib/size-guides";
import { RelatedProducts } from "@/components/storefront/related-products";
import { useT } from "@/lib/i18n-context";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient
      .ensureQueryData(productQuery(params.slug))
      .catch(() => null);
    if (!product) throw notFound();
    // Reviews and size guide are rendered below the fold; fetch them during SSR
    // too so the first paint is complete, but a failure must not blank the page.
    await Promise.all([
      context.queryClient.ensureQueryData(reviewsQuery(product.id)).catch(() => null),
      context.queryClient.ensureQueryData(sizeGuidesQuery(product.id)).catch(() => null),
    ]);
    return { product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return { meta: [{ title: "المنتج غير موجود" }] };
    const description =
      product.description?.trim().slice(0, 155) ??
      `اطلب ${product.name} مع الدفع عند الاستلام والتوصيل إلى ولايتك.`;
    return {
      meta: [
        { title: product.name },
        { name: "description", content: description },
        { property: "og:title", content: product.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { data: live, isError, error, refetch } = useProduct(product.slug);
  const t = useT();

  const current = live ?? product;

  return (
    <StoreLayout>
      <div className="container-page flex flex-col gap-12 py-8 sm:py-12">
        {isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : (
          <ProductDetail product={current} />
        )}

        <SizeGuide productId={current.id} />

        <RelatedProducts product={current} />

        <section className="flex flex-col gap-5" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="font-display text-xl font-semibold">
            {t("reviews.title")}
          </h2>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <ReviewList productId={current.id} />
            <ReviewForm productId={current.id} />
          </div>
        </section>
      </div>
    </StoreLayout>
  );
}
