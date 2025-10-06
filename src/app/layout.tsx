import type { Metadata } from 'next';
import AppWrapper from '@/components/AppWrapper';

import favicon from '@/assets/images/favicon.ico';
import { appDescription, appTitle } from '@/helpers';
import { ChildrenType } from '@/types';
import { ReduxProvider } from './providers';

import '@/assets/scss/app.scss';
import { ibmPlexSans, inter, nunito, poppins, publicSans, roboto } from '@/helpers/fonts';

// CSS imports (unchanged)
import 'datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css';
import 'datatables.net-fixedheader-bs5/css/fixedHeader.bootstrap5.min.css';
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css';
import 'datatables.net-select-bs5/css/select.bootstrap5.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import 'jsvectormap/dist/css/jsvectormap.min.css';
import 'ladda/dist/ladda.min.css';
import 'leaflet/dist/leaflet.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-datepicker/dist/react-datepicker.min.css';
import 'react-day-picker/style.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-quill-new/dist/quill.bubble.css';
import 'react-quill-new/dist/quill.core.css';
import 'react-quill-new/dist/quill.snow.css';
import 'simplebar-react/dist/simplebar.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';

export const metadata: Metadata = {
  title: {
    default: appTitle,
    template: '%s | ' + appTitle,
  },
  description: appDescription,
  icons: [{ rel: 'icon', url: favicon.src }],
};

const RootLayout = ({ children }: ChildrenType) => {
  return (
    <html lang="en" className={`${nunito.variable} ${publicSans.variable} ${poppins.variable} ${roboto.variable} ${inter.variable} ${ibmPlexSans.variable}`}>
      <body suppressHydrationWarning={true}>
        <ReduxProvider>
          <AppWrapper>{children}</AppWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
};

export default RootLayout;