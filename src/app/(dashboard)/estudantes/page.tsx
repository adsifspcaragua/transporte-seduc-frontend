import { StudentsWorkspace } from "@/components/ui/estudantes/StudentsWorkspace";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const studentId = Number(id);
  return (
    <StudentsWorkspace
      initialStudentId={
        Number.isSafeInteger(studentId) && studentId > 0 ? studentId : undefined
      }
    />
  );
}
