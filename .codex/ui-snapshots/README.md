# UI snapshots

Each version stores exact file contents as Git blob objects without committing or stashing unrelated changes.

Restore a file with `git show <blob> > <path>`.

## V0 - before authored UI pass (2026-07-27)

| Blob | File |
| --- | --- |
| `c334e86c78a704c643b33eb8af7838631a93e311` | `src/app/globals.css` |
| `df24f559fa07bab8ddc299d46d3851195f6cc438` | `src/components/layout/AppShell.tsx` |
| `2752c1fe446a4b9ce436865cac4e1a1225669084` | `src/components/layout/AppHeader.tsx` |
| `d9ecccda517fcccdd55b9c7ee9bb94a3ce6701db` | `src/components/layout/AppSidebar.tsx` |
| `b356e4b864d7c647c3f1dfc829298bce60dad361` | `src/components/layout/BottomNav.tsx` |
| `d42423b9c3162be3195927912e4362f13c86c8e4` | `src/components/layout/navigation.ts` |
| `2f308f09e41de2de6a15c85ad0a3ab2e8544aa4a` | `src/app/page.tsx` |
| `6bbe385d43ea97d1ef0a4d9144fff288914df895` | `src/app/login/page.tsx` |
| `1d89c26afb2a97b241b5e357900a8e4d5609a36c` | `src/app/register/page.tsx` |
| `22f2e11bc21cd19de0f2b3cd86d5a1acdbabda65` | `src/components/common/Panel.tsx` |
| `6e352a61f84afed78776589862328e8e5e8656db` | `src/components/common/Pill.tsx` |
| `ca8e179a11440403ee4cc8163dd122a89f47d226` | `src/components/entry/HomeInputSection.tsx` |
| `c4ee7fc4bacea811587a6dda9a0164d99d4999fc` | `src/components/entry/SmallAiBox.tsx` |

## V1 - authored UI and navigation pass (2026-07-27)

Changes: reduced generic gradients and glow, replaced technical product copy,
introduced a hand-drawn editorial auth style, unified navigation icons, reduced
mobile navigation to five targets, and improved form semantics and touch sizes.

| Blob | File |
| --- | --- |
| `330bdb1a1b752b8a7d29815ed1d2957096c8a0ef` | `src/app/globals.css` |
| `7c4d29d323c2c8746b9174b3fdbe2aa753b5d0fb` | `src/components/layout/AppShell.tsx` |
| `63b9d583031d53faf0c93f9bddee01352fed117a` | `src/components/layout/AppHeader.tsx` |
| `04d522d976fcd00c2b3df75d80faae5a741527b1` | `src/components/layout/AppSidebar.tsx` |
| `d643dab7891a606e858e50b244b466c809adfafd` | `src/components/layout/BottomNav.tsx` |
| `e4e6ff183d4a9d7757960f27a90e7029694116c9` | `src/components/layout/navigation.ts` |
| `a877577161180d0f2d224c995d203414cb61ceaa` | `src/components/layout/NavIcon.tsx` |
| `947f4a4674c194dfb8c65f85a36333331783bdaa` | `src/app/page.tsx` |
| `90d589a50843198d21ec7fb9c8c03528a5add5d9` | `src/app/login/page.tsx` |
| `d0575ce30b9e12f4ff4346f4cdffc923a0b63e9d` | `src/app/register/page.tsx` |
| `b7bf1309a68be81c592a8d8811756a471c1e45ae` | `src/components/common/Panel.tsx` |
| `c962dddde25b5e6613de19eb0226583359bc3f3a` | `src/components/common/Pill.tsx` |
| `57136c1e5914cf16b9cc08b2a4b480a988657434` | `src/components/entry/HomeInputSection.tsx` |
| `72f72ee1efddef69552f1c2076a31af29c128276` | `src/components/entry/SmallAiBox.tsx` |
