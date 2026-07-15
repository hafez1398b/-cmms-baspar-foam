import EquipmentPublicView from '@/components/EquipmentPublicView';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return {
    title: `شناسنامه تجهیز ${code} | بسپارفوم غرب`,
    description: 'شناسنامه دیجیتال تجهیز با QR Code',
  };
}

export default async function EquipmentPublicPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <EquipmentPublicView equipmentCode={code} />;
}
