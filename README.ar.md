# OpenStore DZ

**متجر إلكتروني مجاني ومفتوح المصدر، للشركات الصغيرة والأفراد في الجزائر.**

[الإنجليزية](README.md) · [Français](README.fr.md)

> **المتجر التجريبي واجهة عرض فقط.** الطلبات فيه لا تُرسل أبداً:
> [openstore-dz.vercel.app](https://openstore-dz.vercel.app). OpenStore ليس خدمة مستضافة:
> كل صاحب متجر يثبّت نسخته الخاصة، بقاعدة بياناته ونطاقه وطلباته، ولا يرى أحد غيره
> طلبات متجره أو زبائنه.

---

## ما هو هذا المشروع

متجر إلكتروني كامل يخصك وحدك. لا تدفع شيئا، بدون اشتراك شهري، وبدون فاتورة تركيب.

في الجزائر، أمام صاحب المتجر ثلاث خيارات فقط: الدفع مقابل متجر إلكتروني جاهز، أو بناء
شيء خاص به، أو البيع عبر رسائل فيسبوك وانستغرام. الخيار الأخير ليس سوقا صغيرا:
**47.4% من عمليات الشراء الإلكترونية في الجزائر تتم عبر شبكات التواصل الاجتماعي** مقابل
31.8% فقط عبر مواقع المتاجروJumia، وهي المنصة الوحيدة التي استثمرت مبالغ كبيرة
في الجزائر، **انسحبت في مارس 2026**.

OpenStore يحل هذه المشكلة: متجر حقيقي، بالعربية، وبتثبيت في خطوة واحدة.

---

## الحالة الحالية

**هذه النسخة 0.1.0 وليست متجرا صالحا للاستعمال بعد.** الأساس جاهز ومُتحقق منه: المشروع
يعمل، وفحص الجودة يمر بنجاح، ونظام التصميم مكتمل. المتجر وصفحات المنتجات والدفع ولوحة
التحكم والتوصيل مبنية ومُتحقق منها. ما تبقى مجموع في مراحل داخل `docs/ROADMAP.md`.

| المرحلة | ماذا يوفّر                                  | الحالة                                         |
| ------- | ------------------------------------------- | ---------------------------------------------- |
| 0       | أساس المشروع، فحص الجودة، نظام التصميم      | **منجزة**                                      |
| 1       | مكتبة المهارات، مرجع التصميم، ملفات التوثيق | **منجزة**                                      |
| 2       | قاعدة البيانات والصلاحيات وبيانات تجريبية   | مكتملة، تم التحقق منها على قاعدة بيانات حقيقية |
| 3       | تسجيل دخول الإدارة وإعدادات المتجر          | **منجزة**                                      |
| 4       | المنتجات والباقات ودليل المقاسات            | **منجزة**                                      |
| 5       | الطلبات وقائمة اتصال التأكيد                | **منجزة**                                      |
| 6       | واجهة المتجر وصفحات المنتجات                | **منجزة**                                      |
| 7       | السلة والدفع عند الاستلام                   | **منجزة**                                      |
| 8       | التوصيل عبر Guepex والتتبع                  | **منجزة**                                      |
| 9       | إتاحة الوصول                                | **منجزة**                                      |
| 10      | جاهزية الإطلاق                              | جزئية                                          |

> **المراحل 0 إلى 9 منجزة.** المرحلة 10 جزئية: لم يُقس الأداء بعد على النسخة المبنية،
> ولم يتم أي نشر.
>
> إتاحة الوصول ليست تدقيقا يُجرى مرة واحدة: يشتغل axe-core على قواعد WCAG 2.1 A و AA
> في كل صفحة، وفي كل تشغيل. والتخطيط يُقاس بالطريقة نفسها: لا تجاوز أفقي في أي عرض من
> 320 إلى 1280، مع حد أدنى لحجم مناطق اللمس، ويُقاس على النسخة المبنية لا على خادم
> التطوير.
>
> **أمران يحتاجان تدخلاً بشرياً قبل أن يصبح هذا متجراً حقيقياً.** خطاف Guepex
> يرد بـ `503` حتى تُضبط `GUEPEX_WEBHOOK_SECRET` في مشروع Supabase، والمنتجات
> التجريبية تستعمل صوراً خارجية مؤقتة يجب استبدالها بصور حقيقية.

`docs/CHANGELOG.md` يسجل ما تم التحقق منه فعليا. ما لم يرد فيه، فهو غير جاهز بعد.

---

## لماذا هذا المشروع

**لأن كل شيء مدفوع.** خدمات localisation الجزائرية تبدأ من 999 دج شهريا، أي أكثر من
65000 دج للتركيب، أو أكثر من ذلك عند البناء على Shopify أو WooCommerce.

**ولأن العربية مهملة.** فحصت عشرة مواقع جزائرية: تسعة منها تعلن `lang="fr"` ولا تحدد
اتجاه النص من اليمين إلى اليسار إطلاقا، ومعظمها يحمل خطا لاتينيا فقط، فتظهر العربية
بخط عشوائي من النظام. هذه ليست مشكلة جمالية، بل فجوة تجارية: أكثر من نصف السوق غير
مخدم أصلا.

**ولأن الدفع عند الاستلام ليس ميزة اختيارية.** حوالي 90% من المعاملات الإلكترونية في
الجزائر تتم عند الاستلام. لهذا المنصة لا تحتجز مالكك مال.أبدا.

---

## ما سيفعله المتجر

- واجهة **بالعربية، من اليمين إلى اليسار**، مصممة للهاتف أولا
- منتجات وباقات، بمقاسات وألوان وصور متعددة
- **دليل مقاسات**، وهو العنصر الوحيد الذي يخفض مردودات الملابس من 35–50% إلى 8–15%
- الدفع عند الاستلام، مع إظهار ثمن التوصيل **قبل** أن يطلب الزبون
- **قائمة اتصال التأكيد**، الميزة التي يطلبها التجار الجزائريون بالاسم، لأنها تخفض
- الرفض من 15–20% إلى أقل بكثير
- التوصيل عبر Guepex (سابقا Yalidine) مع تتبع مباشر
- تعليقات الزبائن، وهي غائبة اليوم عن كل متجر جزائري تقريبًا

---

## التثبيت

### الأدوات المطلوبة

| الأداة           | لماذا                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Git**          | لتحميل المشروع                                              |
| **Node.js 20+**  | لتشغيل المشروع                                              |
| **npm**          | يأتي مع Node.js                                             |
| **Docker**       | لتشغيل قاعدة البيانات محليا، أو استعمل مشروع Supabase مجاني |
| **Supabase CLI** | تأكد منها بالأمر `npx supabase --version`                   |

### الطريقة العادية

```bash
git clone https://github.com/Meykiio/openstore-dz.git
cd openstore-dz
npm install
npx supabase start
cp .env.example .env     # ضع رابط المشروع والمفتاح العام
npm run dev              # http://localhost:8080
```

---

## التثبيت الآلي: انسخ هذا الأمر إلى المساعد الذكي

انسخ كل ما بينعلامتين أدناه، والصقه في Claude Code أو Claude Desktop أو Cursor أو
opencode أو Gemini CLI أو Windsurf. سيقوم المساعد بتثبيت كل شيء، وإنشاء قاعدة البيانات،
وتطبيق الجداول، وملء ملف الإعدادات، والتحقق من كل خطوة.

```text
You are setting up OpenStore DZ, a free self-hosted e-commerce platform for Algerian
small businesses, for a non-technical shop owner who reads Arabic. Work autonomously,
verify every step, and explain each step in one plain Arabic sentence. Never skip a
failed verification: diagnose the root cause, fix it, and re-run before continuing.

IMPORTANT: Write every explanation and the final report to the user in clear Arabic.
Keep technical identifiers (file names, commands, variable names) in English, but
surround them with Arabic explanation. The user must be able to follow every step
without reading English.

FIRST, ASK ONE QUESTION before installing anything, in Arabic:
"هل تريد أن تستخدم قاعدة بيانات على جهازك (Docker، مجانية و خاصة بالكامل) أم مشروع
Supabase مجاني على الإنترنت؟"
Wait for the answer, then follow PATH A or PATH B.

0. DETECT THE PLATFORM FIRST. Determine the OS (Windows, macOS, Linux) and the CPU
   architecture. Report it. On Windows, also state whether you are in PowerShell, cmd,
   or Git Bash, and use the correct syntax for each.

1. VERIFY PREREQUISITES. Check each; install anything missing using the
   OS-appropriate method. Report exactly what you installed, in Arabic.
   - Git: `git --version`
       Windows: winget install Git.Git  |  macOS: brew install git  |  Linux: apt install git
   - Node.js 20+: `node -v`
       Windows: winget install OpenJS.NodeJS.LTS  |  macOS: brew install node  |  Linux: apt install nodejs npm
   - npm: `npm -v`
   - Docker (must be RUNNING, not just installed): `docker version`
       Windows/macOS: Docker Desktop, winget install Docker.DockerDesktop (needs a
       restart and WSL2) | brew install --cask docker
       Linux: Docker Engine, then `sudo systemctl enable --now docker`
   - Supabase CLI: `npx supabase --version`

2. CLONE. If the current folder is not already the project:
   git clone https://github.com/Meykiio/openstore-dz.git
   cd openstore-dz

3. INSTALL DEPENDENCIES. Run `npm install`. If it fails, diagnose and fix the root
   cause before continuing.

--- PATH A: LOCAL DATABASE (Docker) ---

A1. START SUPABASE LOCALLY. Run `npx supabase start`. Wait for the API URL, anon key,
   Studio URL and DB URL. A "not linked" message is expected and is not an error here.

A2. APPLY THE DATABASE SCHEMA. From bash (Git Bash on Windows), run:
   docker exec -i supabase_db_openstore-dz psql -U postgres -v ON_ERROR_STOP=1 < supabase/schema.sql
   Do NOT use `npx supabase db reset`: its seed loader cannot run a file that
   creates tables. Alternative: Studio (http://127.0.0.1:54323) -> SQL Editor,
   paste the whole file, Run.
   Verify: `select count(*) from public.store_settings;` should return 1.

A3. ENVIRONMENT. Create `.env` in the project root. Never commit it.
   VITE_SUPABASE_URL=<API URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
   VITE_SUPABASE_PROJECT_ID=local

A4. Email confirmation is off locally, so sign-up works immediately.

--- PATH B: SUPABASE CLOUD (no Docker) ---

B1. Ask the user, in Arabic, for TWO values from their free Supabase project
   (supabase.com -> the project -> Project Settings -> API):
     - Project URL
     - the publishable/anon key. Tell them clearly: this key can safely go in .env.
       The service_role key must NEVER be used or shared.
   If they have no project, walk them through creating one on the free plan.

B2. Tell the user, in Arabic, to DISABLE EMAIL CONFIRMATION and explain why:
   Authentication -> Sign In / Providers -> Email -> turn OFF "Confirm email".
   A new cloud project has it ON, which blocks account creation completely.
   Tell them plainly that they should turn it back ON later.

B3. APPLY THE SCHEMA ONCE. Dashboard -> SQL Editor -> New query. Paste the FULL contents
   of `supabase/schema.sql` and Run.
   Verify: `select count(*) from public.store_settings;` should return 1.

B4. ENVIRONMENT. Create `.env` (never commit it):
   VITE_SUPABASE_URL=<Project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
   VITE_SUPABASE_PROJECT_ID=<project ref>

--- FINISH (both paths) ---

4. START THE APP. Run `npm run dev` in the background. Confirm http://localhost:8080 loads
   and that the on-page check says the database is connected. If it does not, STOP and
   fix it. Do not report success while that check is failing.

5. RUN THE QUALITY GATE. Run `npm run check`. Report the result honestly in Arabic.
   If any step fails, fix the cause and re-run.

6. FINAL REPORT, in clear Arabic:
   - ما الذي يعمل، وأين
   - الأوامر اليومية، وكيف توقف كل شيء
   - ما تبقى مطلوبا من صاحب المتجر يدويا
   - أي مشكلة متبقية، مع نص الخطأ كما هو

HARD RULES:
- Never commit secrets or .env files. Never run `git commit`.
- Never modify the database except through `supabase/schema.sql`.
- The service_role key must never appear in the app, in `.env`, or in your reply.
- Do not add dependencies.
- If a step cannot be completed, STOP and explain exactly what is missing, in Arabic,
  rather than improvising or guessing a value.
```

---

## بيانات التوصيل (Guepex)

لا يمكن لأي مساعد ذكي إنشاء هذه القيم. موجودة فقط في حسابك على Guepex. ضعها مباشرة في
`.env` ولا تضعها في أي محادثة:

```
GUEPEX_API_ID=
GUEPEX_API_TOKEN=
GUEPEX_BASE_URL=https://api.guepex.app/v1/
GUEPEX_WEBHOOK_SECRET=
```

الشرح الكامل في `docs/skills/yalidine-integration/references/human-only-steps.md`.

---

## التوثيق

| الملف                  | المحتوى                                 |
| ---------------------- | --------------------------------------- |
| `docs/PROJECT.md`      | الحالة الحالية ونطاق المشروع            |
| `docs/ARCHITECTURE.md` | بنية النظام                             |
| `docs/DATABASE.md`     | الجداول والصلاحيات والمتطلبات القانونية |
| `docs/FEATURES.md`     | الميزات المتحقق منها فقط                |
| `docs/DEPLOY.md`       | نشر المتجر على الإنترنت                 |
| `docs/DECISIONS.md`    | القرارات ولماذا                         |
| `docs/CHANGELOG.md`    | ما تغيّر فعلا                           |
| `AGENTS.md`            | قواعد العمل داخل المستودع               |

## فحص الجودة

```bash
npm run check
```

يجب أن يمر قبل كل عملية حفظ (commit).

## المساهمة

راجع `CONTRIBUTING.md`. أكثر مسافة قيمة ليست كودا: ثبّت المشروع، استعمله أسبوعا
كصاحب متجر، وأخبرنا بما كان محيرا أو معقدا.

## الرخصة

[AGPL-3.0-only](LICENSE). مجاني ويبقى مجانيا.

---

**© 2026 Sifeddine Mebarki** — بُني للمجتمع الجزائري، بطموح عالمي.
