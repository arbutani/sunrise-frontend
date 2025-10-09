import { type MenuItemType } from '@/types/layout'
import { type IconType } from 'react-icons'
import { TbBellRinging, TbCreditCard, TbHeadset, TbLock, TbLogout2, TbSettings2, TbUserCircle } from 'react-icons/tb'
import {
 
  LuCircleGauge,
  LuUsers,
  LuUserX,
 
} from 'react-icons/lu'

type UserDropdownItemType = {
  label?: string
  icon?: IconType
  url?: string
  isDivider?: boolean
  isHeader?: boolean
  class?: string
}

export const userDropdownItems: UserDropdownItemType[] = [
  {
    label: 'Welcome back!',
    isHeader: true,
  },
  {
    label: 'Profile',
    icon: TbUserCircle,
    url: '/users/profile',
  },
  {
    label: 'Notifications',
    icon: TbBellRinging,
    url: '#',
  },
  {
    label: 'Balance: $985.25',
    icon: TbCreditCard,
    url: '#',
  },
  {
    label: 'Account Settings',
    icon: TbSettings2,
    url: '#',
  },
  {
    label: 'Support Center',
    icon: TbHeadset,
    url: '#',
  },
  {
    isDivider: true,
  },
  {
    label: 'Lock Screen',
    icon: TbLock,
    url: '/auth-1/lock-screen',
  },
  {
    label: 'Log Out',
    icon: TbLogout2,
    url: '#',
    class: 'text-danger fw-semibold',
  },
]

export const menuItems: MenuItemType[] = [
  { key: 'navigation', label: 'Navigation', isTitle: true },
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: LuCircleGauge,
    url: '/mainDeshbord',
   },
   {
    key: 'employee',
    label: 'Employee',
    icon: LuUsers,
    url: '/employee',
   },
   {
    key: 'admin',
    label: 'Admin',
    icon: LuUserX,
    url: '/admin',
   }, 
 
]

/*export const horizontalMenuItems: MenuItemType[] = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: TbLayoutDashboard,
    children: [
      { key: 'dashboard-v1', label: 'Dashboard 1', url: '/dashboard' },
      { key: 'dashboard-v2', label: 'Dashboard 2', url: '/dashboard2' },
    ],
  },
  {
    key: 'apps',
    label: 'Apps',
    icon: TbApps,
    children: [
      { key: 'calendar', label: 'Calendar', icon: TbCalendar, url: '/calendar' },
      { key: 'chat', label: 'Chat', icon: TbMessageDots, url: '/chat' },
      { key: 'file-manager', label: 'File Manager', icon: TbFolder, url: '/file-manager' },
      {
        key: 'ecommerce',
        label: 'Ecommerce',
        icon: TbBasket,
        children: [
          {
            key: 'products',
            label: 'Products',
            children: [
              { key: 'product-list', label: 'Listing', url: '/products' },
              { key: 'product-grid', label: 'Product Grid', url: '/products-grid' },
              { key: 'product-details', label: 'Product Details', url: '/products/1' },
              { key: 'add-product', label: 'Add Product', url: '/add-product' },
            ],
          },
          { key: 'categories', label: 'Categories', url: '/categories' },
          {
            key: 'orders',
            label: 'Orders',
            children: [
              { key: 'orders-list', label: 'Orders', url: '/orders' },
              { key: 'order-details', label: 'Order Details', url: '/orders/1' },
            ],
          },
          { key: 'customers', label: 'Customers', url: '/customers' },
          {
            key: 'sellers',
            label: 'Sellers',
            children: [
              { key: 'sellers-list', label: 'Sellers', url: '/sellers' },
              { key: 'seller-details', label: 'Seller Details', url: '/sellers/1' },
            ],
          },
          { key: 'reviews', label: 'Reviews', url: '/reviews' },
        ],
      },
      {
        key: 'email',
        label: 'Email',
        icon: LuInbox,
        badge: { variant: 'danger', text: 'New' },
        children: [
          { key: 'inbox', label: 'Inbox', url: '/inbox' },
          { key: 'inbox-details', label: 'Details', url: '/inbox/1' },
          { key: 'email-compose', label: 'Compose', url: '/email-compose' },
          { key: 'email-templates', label: 'Email Templates', url: '/email-templates' },
        ],
      },
      {
        key: 'crm',
        label: 'CRM',
        icon: LuHandshake,
        children: [
          { key: 'crm-contacts', label: 'Contacts', url: '/crm/contacts' },
          { key: 'crm-opportunities', label: 'Opportunities', url: '/crm/opportunities' },
          { key: 'crm-deals', label: 'Deals', url: '/crm/deals' },
          { key: 'crm-leads', label: 'Leads', url: '/crm/leads' },
          { key: 'crm-campaign', label: 'Campaign', url: '/crm/campaign' },
          { key: 'crm-proposals', label: 'Proposals', url: '/crm/proposals' },
          { key: 'crm-estimations', label: 'Estimations', url: '/crm/estimations' },
          { key: 'crm-customers', label: 'Customers', url: '/crm/customers' },
          { key: 'crm-activities', label: 'Activities', url: '/crm/activities' },
        ],
      },
      {
        key: 'users',
        label: 'Users',
        icon: LuUsers,
        children: [
          { key: 'contacts', label: 'Contacts', url: '/users/contacts' },
          { key: 'profile', label: 'Profile', url: '/users/profile' },
          { key: 'roles', label: 'Roles', url: '/users/roles' },
          { key: 'roles-details', label: 'Roles Details', url: '/users/roles-details' },
          { key: 'permissions', label: 'Permissions', url: '/users/permissions' },
        ],
      },

      {
        key: 'invoice',
        label: 'Invoice',
        icon: LuReceiptText,
        children: [
          { key: 'invoice-list', label: 'Invoice', url: '/invoices' },
          { key: 'invoice-details', label: 'Single Invoice', url: '/invoices/1' },
          { key: 'add-invoice', label: 'New Invoice', url: '/add-invoice' },
        ],
      },
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: LuNotebookText,
    children: [
      {
        key: 'general-pages',
        label: 'General Pages',
        icon: LuNotebookText,
        children: [
          { key: 'faq', label: 'FAQ', url: '/pages/faq' },
          { key: 'pricing', label: 'Pricing', url: '/pages/pricing' },
          { key: 'empty-page', label: 'Empty Page', url: '/pages/empty-page' },
          { key: 'timeline', label: 'Timeline', url: '/pages/timeline' },
          { key: 'sitemap', label: 'Sitemap', url: '/pages/sitemap' },
          { key: 'search-results', label: 'Search Results', url: '/pages/search-results' },
          { key: 'coming-soon', label: 'Coming Soon', url: '/coming-soon' },
          { key: 'terms-conditions', label: 'Terms & Conditions', url: '/pages/terms-conditions' },
        ],
      },
      {
        key: 'version-1',
        label: 'Basic',
        icon: LuShieldBan,
        children: [
          { key: 'sign-in', label: 'Sign In', url: '/auth-1/sign-in' },
          { key: 'sign-up', label: 'Sign Up', url: '/auth-1/sign-up' },
          { key: 'reset-pass', label: 'Reset Password', url: '/auth-1/reset-password' },
          { key: 'new-pass', label: 'New Password', url: '/auth-1/new-password' },
          { key: 'two-factor', label: 'Two Factor', url: '/auth-1/two-factor' },
          { key: 'lock-screen', label: 'Lock Screen', url: '/auth-1/lock-screen' },
          { key: 'success-mail', label: 'Success Mail', url: '/auth-1/success-mail' },
          { key: 'login-pin', label: 'Login with PIN', url: '/auth-1/login-pin' },
          { key: 'delete-account', label: 'Delete Account', url: '/auth-1/delete-account' },
        ],
      },
      {
        key: 'version-2',
        label: 'Cover',
        icon: TbUserHexagon,
        children: [
          { key: 'sign-in-2', label: 'Sign In', url: '/auth-2/sign-in' },
          { key: 'sign-up-2', label: 'Sign Up', url: '/auth-2/sign-up' },
          {
            key: 'reset-pass-2',
            label: 'Reset Password',
            url: '/auth-2/reset-password',
          },
          { key: 'new-pass-2', label: 'New Password', url: '/auth-2/new-password' },
          { key: 'two-factor-2', label: 'Two Factor', url: '/auth-2/two-factor' },
          { key: 'lock-screen-2', label: 'Lock Screen', url: '/auth-2/lock-screen' },
          { key: 'success-mail-2', label: 'Success Mail', url: '/auth-2/success-mail' },
          { key: 'login-pin-2', label: 'Login with PIN', url: '/auth-2/login-pin' },
          {
            key: 'delete-account-2',
            label: 'Delete Account',
            url: '/auth-2/delete-account',
          },
        ],
      },
      {
        key: 'error',
        label: 'Error Pages',
        icon: LuShieldAlert,
        children: [
          { key: 'error-400', label: '400', url: '/error/400' },
          { key: 'error-401', label: '401', url: '/error/401' },
          { key: 'error-403', label: '403', url: '/error/403' },
          { key: 'error-404', label: '404', url: '/error/404' },
          { key: 'error-408', label: '408', url: '/error/408' },
          { key: 'error-500', label: '500', url: '/error/500' },
          { key: 'maintenance', label: 'Maintenance', url: '/maintenance' },
        ],
      },
    ],
  },
  {
    key: 'components',
    label: 'Components',
    icon: TbComponents,
    children: [
      {
        key: 'ui-one',
        label: 'Base UI One',
        icon: LuPencilRuler,
        children: [
          {
            key: 'accordions',
            label: 'Accordions',
            url: '/ui/accordions',
          },
          {
            key: 'alerts',
            label: 'Alerts',
            url: '/ui/alerts',
          },
          {
            key: 'images',
            label: 'Images',
            url: '/ui/images',
          },
          {
            key: 'badges',
            label: 'Badges',
            url: '/ui/badges',
          },
          {
            key: 'breadcrumb',
            label: 'Breadcrumb',
            url: '/ui/breadcrumb',
          },
          {
            key: 'buttons',
            label: 'Buttons',
            url: '/ui/buttons',
          },
          {
            key: 'cards',
            label: 'Cards',
            url: '/ui/cards',
          },
          {
            key: 'carousel',
            label: 'Carousel',
            url: '/ui/carousel',
          },
          {
            key: 'collapse',
            label: 'Collapse',
            url: '/ui/collapse',
          },
          {
            key: 'colors',
            label: 'Colors',
            url: '/ui/colors',
          },
          {
            key: 'dropdowns',
            label: 'Dropdowns',
            url: '/ui/dropdowns',
          },
          {
            key: 'videos',
            label: 'Videos',
            url: '/ui/videos',
          },
          {
            key: 'grid',
            label: 'Grid Options',
            url: '/ui/grid',
          },
        ],
      },
      {
        key: 'ui-two',
        label: 'Base UI Two',
        icon: LuPencilRuler,
        children: [
          {
            key: 'links',
            label: 'Links',
            url: '/ui/links',
          },
          {
            key: 'list-group',
            label: 'List Group',
            url: '/ui/list-group',
          },
          {
            key: 'modals',
            label: 'Modals',
            url: '/ui/modals',
          },
          {
            key: 'notifications',
            label: 'Notifications',
            url: '/ui/notifications',
          },
          {
            key: 'offcanvas',
            label: 'Offcanvas',
            url: '/ui/offcanvas',
          },
          {
            key: 'placeholders',
            label: 'Placeholders',
            url: '/ui/placeholders',
          },
          {
            key: 'pagination',
            label: 'Pagination',
            url: '/ui/pagination',
          },
          {
            key: 'popovers',
            label: 'Popovers',
            url: '/ui/popovers',
          },
          {
            key: 'progress',
            label: 'Progress',
            url: '/ui/progress',
          },
          {
            key: 'spinners',
            label: 'Spinners',
            url: '/ui/spinners',
          },
          {
            key: 'tabs',
            label: 'Tabs',
            url: '/ui/tabs',
          },
          {
            key: 'tooltips',
            label: 'Tooltips',
            url: '/ui/tooltips',
          },
          {
            key: 'typography',
            label: 'Typography',
            url: '/ui/typography',
          },
          {
            key: 'utilities',
            label: 'Utilities',
            url: '/ui/utilities',
          },
        ],
      },
      {
        key: 'widgets',
        label: 'Widgets',
        icon: LuDessert,
        url: '/widgets',
      },

      {
        key: 'apexchart-1',
        label: 'Apex Charts 1',
        icon: LuChartNoAxesCombined,
        children: [
          { key: 'apex-area-chart', label: 'Area', url: '/charts/apex/area' },
          { key: 'apex-bar-chart', label: 'Bar', url: '/charts/apex/bar' },
          { key: 'apex-bubble-chart', label: 'Bubble', url: '/charts/apex/bubble' },
          { key: 'apex-candlestick-chart', label: 'Candlestick', url: '/charts/apex/candlestick' },
          { key: 'apex-column-chart', label: 'Column', url: '/charts/apex/column' },
          { key: 'apex-heatmap-chart', label: 'Heatmap', url: '/charts/apex/heatmap' },
          { key: 'apex-line-chart', label: 'Line', url: '/charts/apex/line' },
          { key: 'apex-mixed-chart', label: 'Mixed', url: '/charts/apex/mixed' },
          { key: 'apex-timeline-chart', label: 'Timeline', url: '/charts/apex/timeline' },
          { key: 'apex-boxplot-chart', label: 'Boxplot', url: '/charts/apex/boxplot' },
          { key: 'apex-treemap-chart', label: 'Treemap', url: '/charts/apex/treemap' },
        ],
      },
      {
        key: 'apexchart-2',
        label: 'Apex Charts 2',
        icon: LuChartNoAxesCombined,
        children: [
          { key: 'apex-pie-chart', label: 'Pie', url: '/charts/apex/pie' },
          { key: 'apex-radar-chart', label: 'Radar', url: '/charts/apex/radar' },
          { key: 'apex-radialbar-chart', label: 'Radialbar', url: '/charts/apex/radialbar' },
          { key: 'apex-scatter-chart', label: 'Scatter', url: '/charts/apex/scatter' },
          { key: 'apex-polar-area-chart', label: 'Polar Area', url: '/charts/apex/polar-area' },
          { key: 'apex-sparkline-chart', label: 'Sparklines', url: '/charts/apex/sparklines' },
          { key: 'apex-range-chart', label: 'Range', url: '/charts/apex/range' },
          { key: 'apex-funnel-chart', label: 'Funnel', url: '/charts/apex/funnel' },
          { key: 'apex-slope-chart', label: 'Slope', url: '/charts/apex/slope' },
          {
            key: 'apex-tree',
            label: 'Apex Tree',
            url: '/charts/apex-tree',
          },
        ],
      },

      {
        key: 'forms',
        label: 'Forms',
        icon: LuFileInput,
        children: [
          {
            key: 'form-basic-elements',
            label: 'Basic Elements',
            url: '/forms/basic',
          },
          {
            key: 'form-pickers',
            label: 'Pickers',
            url: '/forms/pickers',
          },
          {
            key: 'form-select',
            label: 'Select',
            url: '/forms/select',
          },
          {
            key: 'form-validation',
            label: 'Validation',
            url: '/forms/validation',
          },
          {
            key: 'form-wizard',
            label: 'Wizard',
            url: '/forms/wizard',
          },
          {
            key: 'form-file-uploads',
            label: 'File Uploads',
            url: '/forms/file-uploads',
          },
          {
            key: 'form-text-editors',
            label: 'Text Editors',
            url: '/forms/editors',
          },
          {
            key: 'form-slider',
            label: 'Slider',
            url: '/forms/slider',
          },
          {
            key: 'form-layouts',
            label: 'Layouts',
            url: '/forms/layouts',
          },
          {
            key: 'form-other-plugins',
            label: 'Other Plugins',
            url: '/forms/other-plugins',
          },
        ],
      },
      {
        key: 'icons',
        label: 'Icons',
        icon: LuSparkles,
        children: [
          {
            key: 'tabler-icons',
            label: 'Tabler',
            url: '/icons/tabler',
          },
          {
            key: 'lucide-icons',
            label: 'Lucide',
            url: '/icons/lucide',
          },
          {
            key: 'flags',
            label: 'Flags',
            url: '/icons/flags',
          },
        ],
      },
      {
        key: 'maps',
        label: 'Maps',
        icon: LuMapPinned,
        children: [
          {
            key: 'vector-maps',
            label: 'Vector Maps',
            url: '/maps/vector',
          },
          {
            key: 'leaflet-maps',
            label: 'Leaflet Maps',
            url: '/maps/leaflet',
          },
        ],
      },
    ],
  },
  {
    key: 'miscellaneous',
    label: 'Miscellaneous',
    icon: LuHousePlug,
    children: [
      { key: 'nestable-list', label: 'Nestable List', url: '/miscellaneous/nestable-list' },
      { key: 'pdf-viewer', label: 'PDF Viewer', url: '/miscellaneous/pdf-viewer' },
      { key: 'sweet-alert', label: 'Sweet Alert', url: '/miscellaneous/sweet-alert' },
      { key: 'password-meter', label: 'Password Meter', url: '/miscellaneous/password-meter' },
      { key: 'clipboard', label: 'Clipboard', url: '/miscellaneous/clipboard' },
      { key: 'tree-view', label: 'Tree View', url: '/miscellaneous/tree-view' },
      { key: 'tour', label: 'Tour', url: '/miscellaneous/tour' },
    ],
  },
  {
    key: 'tables',
    label: 'Tables',
    icon: LuTable,
    children: [
      {
        key: 'static-tables',
        label: 'Static Tables',
        url: '/tables/static',
      },
      {
        key: 'tanstack-tables',
        label: 'Tanstack Tables',
        url: '/tables/tanstack',
      },
      {
        key: 'data-tables',
        label: 'DataTables',
        badge: { variant: 'success', text: '13' },
        children: [
          { key: 'data-tables-basic', label: 'Basic', url: '/tables/data-tables/basic' },
          { key: 'data-tables-export-data', label: 'Export Data', url: '/tables/data-tables/export-data' },
          { key: 'data-tables-select', label: 'Select', url: '/tables/data-tables/select' },
          { key: 'data-tables-ajax', label: 'Ajax', url: '/tables/data-tables/ajax' },
          {
            key: 'data-tables-javascript-source',
            label: 'Javascript Source',
            url: '/tables/data-tables/javascript-source',
          },
          {
            key: 'data-tables-data-rendering',
            label: 'Data Rendering',
            url: '/tables/data-tables/data-rendering',
          },
          { key: 'data-tables-scroll', label: 'Scroll', url: '/tables/data-tables/scroll' },
          { key: 'data-tables-columns', label: 'Show & Hide Column', url: '/tables/data-tables/columns' },
          { key: 'data-tables-child-rows', label: 'Child Rows', url: '/tables/data-tables/child-rows' },
          {
            key: 'data-tables-column-searching',
            label: 'Column Searching',
            url: '/tables/data-tables/column-searching',
          },
          {
            key: 'data-tables-fixed-header',
            label: 'Fixed Header',
            url: '/tables/data-tables/fixed-header',
          },
          {
            key: 'data-tables-add-rows',
            label: 'Add Rows',
            url: '/tables/data-tables/add-rows',
          },
          {
            key: 'data-tables-checkbox-select',
            label: 'Checkbox Select',
            url: '/tables/data-tables/checkbox-select',
          },
        ],
      },
    ],
  },
  {
    key: 'layouts',
    label: 'Layouts',
    icon: LuProportions,
    children: [
      {
        key: 'layout-options',
        label: 'Layout Options',
        icon: LuProportions,
        children: [
          { key: 'scrollable', label: 'Scrollable', url: '/layouts/scrollable' },
          { key: 'compact', label: 'Compact', url: '/layouts/compact' },
          { key: 'boxed', label: 'Boxed', url: '/layouts/boxed' },
          { key: 'horizontal', label: 'Horizontal', url: '/layouts/horizontal' },
        ],
      },
      {
        key: 'sidebars',
        label: 'Sidebars',
        icon: LuPanelRightClose,
        children: [
          { key: 'compact-menu', label: 'Compact Menu', url: '/layouts/sidebars/compact' },
          { key: 'icon-view-menu', label: 'Icon View Menu', url: '/layouts/sidebars/icon-view' },
          { key: 'on-hover-menu', label: 'On Hover Menu', url: '/layouts/sidebars/on-hover' },
          {
            key: 'on-hover-active-menu',
            label: 'On Hover Active Menu',
            url: '/layouts/sidebars/on-hover-active',
          },
          { key: 'offcanvas-menu', label: 'Offcanvas Menu', url: '/layouts/sidebars/offcanvas' },
          {
            key: 'no-icons-with-lines-menu',
            label: 'No Icons With Lines',
            url: '/layouts/sidebars/no-icons-with-lines',
          },
          {
            key: 'with-lines-menu',
            label: 'Sidebar With Lines',
            url: '/layouts/sidebars/with-lines',
          },
          { key: 'light-menu', label: 'Light Menu', url: '/layouts/sidebars/light' },
          { key: 'gradient-menu', label: 'Gradient Menu', url: '/layouts/sidebars/gradient' },
          { key: 'gray-menu', label: 'Gray Menu', url: '/layouts/sidebars/gray' },
          { key: 'image-menu', label: 'Image Menu', url: '/layouts/sidebars/image' },
        ],
      },
      {
        key: 'topbars',
        label: 'Topbar',
        icon: LuPanelTop,
        children: [
          { key: 'dark-topbar', label: 'Dark Topbar', url: '/layouts/topbars/dark' },
          { key: 'gray-topbar', label: 'Gray Topbar', url: '/layouts/topbars/gray' },
          { key: 'gradient-topbar', label: 'Gradient Topbar', url: '/layouts/topbars/gradient' },
        ],
      },
    ],
  },
  {
    key: 'landing',
    label: 'Landing',
    icon: LuEarth,
    url: '/landing',
  },
]
*/
