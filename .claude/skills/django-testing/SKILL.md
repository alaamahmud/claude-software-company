---
name: django-testing
description: كتابة اختبارات Django بـ pytest-django. تُستخدم عند كتابة اختبارات الخادم أو إصلاحها.
---

## القواعد
- اختبار لكل معيار قبول في docs/01-analysis/user-stories.md.
- استخدم pytest-django مع @pytest.mark.django_db، والمصانع (factory_boy) بدل البيانات الثابتة.
- اختبر الصلاحيات: مستخدم مجهول، ومستخدم بلا صلاحية، ومستخدم مخوّل.
- لكل واجهة API: حالة نجاح، وخطأ تحقق 400، ورفض 403.
- شغّل pytest --cov وأرفق نسبة التغطية في تقريرك.
