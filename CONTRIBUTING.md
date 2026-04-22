# Contributing to MetaTrader Report Analyzer

Thank you for your interest in improving the MetaTrader Report Analyzer!

## 🌐 Internationalization (i18n) Guidelines

All user-facing text must be localized to support our bilingual (EN/VI) architecture.

1. **Use the `t()` function**: Instead of `"Profit"`, use `{t('analysis.netProfit')}`.
2. **Update Dictionary**: Add your new keys to `lib/i18n.tsx` in both the `en` and `vi` sections.
3. **Consistency**: Maintain the same key hierarchy across all languages.

## 🛠️ Code Style

- Use **TypeScript** for all logic.
- Use **Tailwind CSS** for styling.
- Follow the "Smart Store, Stateless UI" pattern (keep logic in `lib/` or stores).

## 🧪 Testing

- Before submitting a PR, run `npm run build` to ensure there are no TypeScript or JSX errors.
- Verify that your changes work in both English and Vietnamese.

## 📄 Documentation

- Update the relevant files in `docs/` or `metatrader-analyzer-skills/` if you introduce new features or change existing workflows.
