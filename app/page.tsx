import useDB from "@/lib/db"

export default async function Index() {
  const data = await useDB().getAcademicYears()

  return (
    <div>
      test
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
