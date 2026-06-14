import PdfMainPage from '@/components/layout/PdfMainPage';
import { Metadata } from 'next';
import { getPdfMetadata } from '@/config/metadata';
import { StructuredDataScript } from '@/components/ui/StructuredDataScript';

export const metadata: Metadata = getPdfMetadata('zh');

export default function ZhPdfPage() {
  return (
    <>
      <StructuredDataScript lang="zh" />
      <PdfMainPage lang="zh" />
    </>
  );
}
