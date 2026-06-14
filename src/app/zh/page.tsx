import MainPage from '@/components/layout/MainPage';
import { Metadata } from 'next';
import { getMetadata } from '@/config/metadata';
import { StructuredDataScript } from '@/components/ui/StructuredDataScript';

export const metadata: Metadata = getMetadata('zh');

export default function ZhPage() {
  return (
    <>
      <StructuredDataScript lang="zh" />
      <MainPage lang="zh" />
    </>
  );
}
