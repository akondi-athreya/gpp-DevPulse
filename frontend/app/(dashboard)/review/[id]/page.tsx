type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  return <main>Review: {id}</main>;
}
