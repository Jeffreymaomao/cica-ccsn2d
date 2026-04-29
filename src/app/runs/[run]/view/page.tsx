import { notFound } from "next/navigation";

type FileViewPageProps = {
  params: Promise<{ run: string }>;
};

export default async function FileViewPage({ params }: FileViewPageProps) {
  await params;
  notFound();
  return (
    <div />
  );
}
