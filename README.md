# شركة برمجيات افتراضية بوكلاء Claude Code

شركة كاملة من **31 موظفاً في 9 أقسام** تعمل كلها داخل **جلسة Claude Code واحدة** هي جلسة المدير التنفيذي. أنت مجلس الإدارة: تعطي الطلب، وتوافق عند ثلاث بوابات، وتتابع كل شيء من المكتب الحي.

المكدس: **Django** + DRF للخادم، **React** للواجهة، و**SQL Server** أو **Oracle** لقاعدة البيانات.

## البدء
1. انسخ محتوى هذا المستودع إلى مشروعك (أو ابدأ مشروعك منه): `CLAUDE.md` و`.claude/` و`docs/`.
2. افتح الجلسة:
   ```bash
   claude
   ```
   الإعداد `"agent": "ceo"` يجعل كل جلسة تبدأ بالمدير التنفيذي (أو صراحةً: `claude --agent ceo`). عُد إليها لاحقاً بـ `claude --continue`.
3. اكتب طلبك، مثلاً: «نظام لإدارة طلبات الإجازات مع موافقة المدير المباشر».
4. تابع الموظفين من [المكتب الحي](https://claude.ai/artifact/DQ4D2J3jXuJLAkkTF6B9SZ) على claude.ai (التفاصيل في [office/README.md](office/README.md)).

> عند إنشاء مجلد `agents` أو `skills` لأول مرة أثناء جلسة مفتوحة، أعد تشغيلها أو نفّذ `/reload-skills`.

## الهيكل
```
CLAUDE.md               ← دستور الشركة
.claude/
  settings.json         ← المدير التنفيذي، العمق 2، فرق الوكلاء معطّلة، حجب .env
  agents/               ← 31 موظفاً، مجلد لكل قسم
  skills/               ← مناهج الإيفاد (django-testing)
  agent-memory/         ← خبرة الموظفين المتراكمة (memory: project)
docs/
  00-management/        ← plan.md، status.json، risks.md
  01-analysis/  02-design/  03-qa/  04-security/  05-release/
  hr/                   ← الإيفاد، سجل التدريب، دليل الموظفين
  standards/            ← معايير الشيفرة
office/                 ← مصدر صفحة المكتب الحي ومخطط حالتها
scripts/gen_agents.py   ← يولّد ملفات الموظفين
```

## الأقسام
| القسم | الرئيس ★ | الموظفون |
|---|---|---|
| الإدارة التنفيذية | `ceo` | `cto`، `project-manager` |
| التحليل | `analysis-lead` | `systems-analyst`، `research-analyst` |
| التصميم والمعمارية | `design-lead` | `database-designer`، `api-designer`، `ui-ux-designer` |
| التطوير | `tech-lead` | `backend-developer`، `frontend-developer`، `database-developer`، `integration-developer` |
| ضمان الجودة | `qa-lead` | `test-automation-engineer`، `code-reviewer` |
| الأمن السيبراني | `security-lead` | `dependency-auditor`، `compliance-officer` |
| العمليات والنشر | `devops-lead` | `deployment-engineer`، `sre-engineer` |
| التوثيق والدعم | `docs-lead` | `user-guide-writer`، `support-specialist` |
| الموارد البشرية والتدريب | `hr-lead` | `personnel-officer`، `skill-author`، `skill-assessor` |

الدليل الكامل بالنماذج: [docs/hr/directory.md](docs/hr/directory.md). سياسة النماذج: `opus` لـ 8 أدوار قرار ومراجعة، و`sonnet` لـ 21 دوراً تنفيذياً، و`haiku` لدورين متكررين.

## دورة العمل
التخطيط ← التحليل ← **🔒 بوابة المتطلبات** ← التصميم (+ اعتماد cto) ← **🔒 بوابة التصميم** ← التطوير ← الجودة ← الأمن ← التوثيق ∥ تجهيز الإصدار ← **🔒 بوابة النشر (بيدك)**.

الرفض من الجودة أو الأمن يعيد العمل إلى التطوير، بحد أقصى 3 دورات ثم تصعيد إليك.

## الإيفاد (تدريب موظف على مهارة)
اطلب من المدير التنفيذي: «أوفِد code-reviewer لتعلّم django-testing، ومعيار النجاح: يكتشف غياب اختبارات الصلاحيات». يكتب `skill-author` المنهج في `.claude/skills/`، ويختبر `skill-assessor` الموظف بالمهارة ودونها في worktree معزول، فإن نجح أضاف `personnel-officer` المهارة إلى حقل `skills` في ملفه، وسُجّلت في `docs/hr/training-register.md`.

## تعديل الموظفين
عدّل الجداول في `scripts/gen_agents.py` ثم:
```bash
python3 scripts/gen_agents.py .
```
(ملف `ceo.md` مكتوب يدوياً داخل السكربت.) أو اطلب من `hr-lead` إنشاء دور جديد.
