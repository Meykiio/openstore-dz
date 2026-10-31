<div dir="rtl">

# تحديث متجر OpenStore

> **English**: [Read this guide in English](UPDATING.md) · **Français**: [Lisez ce guide en français](UPDATING.fr.md)

التحديث جزآن: **الكود** (على GitHub، وVercel ينشره) و**قاعدة البيانات** (على
Supabase). منتجاتك وطلباتك وإعداداتك ومفاتيحك لا تتغير. حوالي خمس دقائق، بدون أي
تثبيت على حاسوبك.

## ما هي حالتك؟

- **أ. ثبّت المتجر بزر "Deploy with Vercel".** أغلب المتاجر. اتبع الجزء أ.
- **ب. عملت Fork للمستودع على GitHub** (تحت اسم مستودعك مكتوب "forked from
  Meykiio/openstore-dz"). اتبع الجزء ب.
- **ج. أنت أو شخص آخر غيّر في الكود.** اتبع الجزء ج، وإلا ستضيع تلك التعديلات.

## أ. ثبّت المتجر بزر Vercel

**في المرة الأولى فقط، أضف زر التحديث إلى مستودعك:**

1. افتح مستودع متجرك على github.com.
2. اضغط **Add file** ثم **Create new file**.
3. في خانة الاسم اكتب بالضبط: `.github/workflows/update-openstore.yml`
4. افتح [هذا الملف](https://raw.githubusercontent.com/Meykiio/openstore-dz/main/.github/workflows/update-openstore.yml)،
   حدّد كل شيء (Ctrl+A)، انسخه، والصقه في المربع الكبير.
5. اضغط **Commit changes** ثم **Commit changes** مرة أخرى.

**في كل تحديث:**

1. في مستودعك افتح تبويب **Actions**. إذا سألك GitHub اضغط
   **I understand my workflows, go ahead and enable them**.
2. اضغط **Update OpenStore** في القائمة، ثم **Run workflow**، ثم الزر الأخضر
   **Run workflow**.
3. انتظر علامة الصح الخضراء (حوالي دقيقة). بعدها ينشر Vercel النسخة الجديدة خلال
   دقيقة أو دقيقتين.
4. انتقل إلى الخطوة **د** لتحديث قاعدة البيانات.

كودك السابق محفوظ في فرع اسمه `backup/before-update-...`. إذا لم يبدأ Vercel النشر
وحده، افتح مشروعك على vercel.com ثم **Deployments**، ثم **Create Deployment**، واكتب
`main` ثم أكّد. (وليس **Redeploy**: فهو يعيد بناء النسخة القديمة.)

## ب. عملت Fork على GitHub

1. افتح مستودعك على github.com.
2. اضغط **Sync fork** ثم **Update branch**. ينشر Vercel النسخة الجديدة.
3. انتقل إلى الخطوة **د**.

## ج. غيّرت في الكود

الزر أعلاه يستبدل الكود، فتبقى تعديلاتك في فرع النسخة الاحتياطية فقط. بدلاً من ذلك
اطلب من مساعد ذكاء اصطناعي (Claude Code أو Cursor أو غيرهما) أن يدمج التحديث لك.
الصق هذه الرسالة:

```text
My shop runs on OpenStore DZ (https://github.com/Meykiio/openstore-dz) and I changed
its code. Update my repository to the latest OpenStore release while keeping my changes:
add the original as a remote named upstream, fetch its latest release tag, merge it
into a new branch, resolve every conflict by keeping both my change and the new
behaviour where possible, run `npm run check` until it passes, and show me what changed
before you push. Do not touch my .env or my Supabase keys. Then tell me to update my
database by running supabase/schema.sql in the Supabase SQL Editor.
```

## د. تحديث قاعدة البيانات

1. افتح لوحة تحكم متجرك (`/admin`). إذا ظهرت رسالة **قاعدة بياناتك تحتاج إلى تحديث**،
   اضغط **انسخ سكربت التحديث** ثم **افتح محرر SQL في Supabase**.
   (لا توجد رسالة؟ انسخ [`supabase/schema.sql`](supabase/schema.sql) من هنا.)
2. الصقه في محرر SQL واضغط **Run**.
3. إذا ظهرت نافذة **Potential issues detected** اضغط **Run without RLS**. السكربت
   يفعّل الحماية على كل الجداول بنفسه، والتحذير يخص متغيراً داخل دالة وليس جدولاً.
4. انتظر رسالة **Success. No rows returned** ثم حدّث لوحة التحكم. ستختفي الرسالة.

تشغيل السكربت مرة ثانية آمن. يحتفظ بمنتجاتك وطلباتك وزبائنك وإعداداتك. يعيد تطبيق
قواعد المتجر (الدوال، قواعد الحماية، حدود تخزين الصور) ويضيف الجديد، مثل أسعار التوصيل
لولايات 2026. منتجات العرض التجريبي لا تُنشأ إلا في متجر لم يطالب به أحد بعد.

## ما الجديد

راجع [سجل التغييرات](docs/CHANGELOG.md). لوحة التحكم تخبرك عندما تصدر نسخة جديدة.

</div>
