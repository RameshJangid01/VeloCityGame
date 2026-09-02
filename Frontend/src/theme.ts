import type { ThemeConfig } from 'antd';

// Brand palette shared across both themes
export const brand = {
  primary: '#00E0C6',   // electric teal — speed/energy
  primaryDeep: '#00A895',
  magenta: '#FF3D8A',
  gold: '#FFB800',
  danger: '#FF4D4F',
  darkBg: '#0A0E17',
  darkBgAlt: '#111726',
  darkPanel: '#161D2E',
  darkBorder: '#232B41',
};

const fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/**
 * Public-facing "game" theme — dark, cinematic, neon-accented.
 * Used for the homepage, live race view, and winner history: the part
 * of the product that should feel like an esports broadcast.
 */
export const darkGameTheme: ThemeConfig = {
  token: {
    fontFamily,
    colorPrimary: brand.primary,
    colorInfo: brand.primary,
    colorSuccess: '#00E08A',
    colorWarning: brand.gold,
    colorError: brand.danger,
    colorBgBase: brand.darkBg,
    colorBgContainer: brand.darkPanel,
    colorBgElevated: brand.darkBgAlt,
    colorBgLayout: brand.darkBg,
    colorBorder: brand.darkBorder,
    colorBorderSecondary: brand.darkBorder,
    colorText: '#F3F5F9',
    colorTextSecondary: 'rgba(243,245,249,0.65)',
    colorTextTertiary: 'rgba(243,245,249,0.45)',
    borderRadius: 14,
    borderRadiusLG: 18,
    controlHeight: 40,
  },
  components: {
    Button: { borderRadius: 12, fontWeight: 700, controlHeight: 42 },
    Card: { borderRadiusLG: 18 },
    Layout: { headerBg: 'rgba(17,23,38,0.85)', bodyBg: 'transparent' },
    Menu: { itemBg: 'transparent', darkItemBg: 'transparent' },
    Modal: { contentBg: brand.darkPanel, headerBg: brand.darkPanel },
    Table: { colorBgContainer: brand.darkPanel },
  },
};

/**
 * Admin dashboard theme — light, calm, and utilitarian, because
 * operators are scanning tables and forms, not watching a show.
 * Same brand accent + font as the public theme to keep the product
 * feeling like one unified system.
 */
export const lightAdminTheme: ThemeConfig = {
  token: {
    fontFamily,
    colorPrimary: brand.primaryDeep,
    colorInfo: brand.primaryDeep,
    colorSuccess: '#12B76A',
    colorWarning: '#F79009',
    colorError: brand.danger,
    colorBgBase: '#F5F7FA',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F7FA',
    colorText: '#101828',
    colorTextSecondary: '#475467',
    borderRadius: 12,
    borderRadiusLG: 16,
    controlHeight: 38,
  },
  components: {
    Button: { borderRadius: 10, fontWeight: 600 },
    Layout: { siderBg: '#0F1420', headerBg: '#FFFFFF', bodyBg: '#F5F7FA' },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(0,224,198,0.16)',
      darkItemSelectedColor: brand.primary,
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemHoverColor: '#fff',
    },
  },
};
