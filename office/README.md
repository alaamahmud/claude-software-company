# المكتب الحي

صفحة على claude.ai، بلا خادم ولا تثبيت: https://claude.ai/artifact/DQ4D2J3jXuJLAkkTF6B9SZ

مقطع معماري في مبنى الشركة عند الغروب: تسع غرف في ثلاثة طوابق، و31 موظفاً على مكاتبهم، ومسار المشروع الذهبي عبر المراحل وبواباتها الثلاث، ومعه لوحة للقرارات المنتظرة والإيفاد والحضور وسجل الجلسة.

- **الجلسة المباشرة**: تقرأ المستند `office/live` من مخزن الصفحة وتتحدث فور تغيّره.
- **جولة تجريبية**: أحداث مكتوبة مسبقاً تعمل حين لا توجد حالة حية، وتظهر عليها كلمة «مثال».

مصدر الصفحة: [`live-office.html`](live-office.html). لنشر تعديل عليها اطلب من Claude Code نشر الملف إلى رابط الصفحة نفسه.

## من يكتب الحالة
المدير التنفيذي `ceo` يكتبها بأداة `ArtifactData` بعد كل تكليف، وعند عودة كل موظف، وعند كل بوابة (التعليمات في `.claude/agents/executive/ceo.md`). الكتابة مسموحة لمالك الصفحة ومحرريها فقط، والقراءة لكل من فُتحت له الصفحة.

> الصفحة لا تستقبل خطافات Claude Code مباشرة، فدقّتها بقدر ما يكتبه المدير التنفيذي: من يعمل، ومن أنجز، ومن ينتظر موافقتك.

## مخطط المستند `office/live`
```json
{
  "project": "نظام طلبات الإجازات",
  "stage": "development",
  "gates": { "requirements": "approved", "design": "approved", "production": "pending" },
  "awaiting_approval": { "title": "اعتماد التصميم", "detail": "docs/02-design/architecture.md و3 ADR" },
  "fix_cycle": 0,
  "progress": { "executive": 100, "analysis": 100, "design": 100, "development": 40, "qa": 10,
                "security": 0, "devops": 0, "docs": 0, "hr": 0 },
  "agents": {
    "tech-lead": { "state": "working", "action": "delegate", "target": "backend-developer" },
    "backend-developer": { "state": "working", "action": "write" },
    "database-developer": { "state": "waiting", "action": "run", "note": "python manage.py migrate" },
    "analysis-lead": { "state": "done" }
  },
  "missions": [
    { "employee": "code-reviewer", "skill": "django-testing",
      "steps": { "author": true, "assessor": false, "test": false, "personnel": false, "certified": false } }
  ],
  "events": [ { "t": "2026-11-04T11:40:00Z", "agent": "tech-lead", "text": "وزّع العمل على ثلاثة مطورين" } ],
  "updated_at": "2026-11-04T11:40:00Z"
}
```

| الحقل | القيم |
|---|---|
| `stage` | `planning` `analysis` `design` `development` `qa` `security` `docs` `release` `deploy` |
| `gates.*` | `pending` أو `approved` |
| `agents.<name>.state` | `working` `waiting` `done` (الموظف الغائب عن القائمة = متاح) |
| `agents.<name>.action` | `read` `write` `run` `search` `web` `delegate` `review` `start` |
| `missions[].steps` | `author` `assessor` `test` `personnel` `certified`؛ الموظف في إيفاد حتى `certified` |
| `events` | الأحدث أولاً، 40 حدثاً على الأكثر |

لا تضع في المستند أسراراً ولا محتوى ملفات ولا نصوص أوامر حساسة: كل من يفتح الصفحة يقرؤه.
