export const TimetableOverviewLoading = () => (
  <table className="table table-fixed text-xs opacity-30">
    <thead>
      <tr className="border-b">
        <th className="w-fit lg:w-[100px]">Index</th>
        <th className="w-fit lg:w-[100px]">Module</th>
        <th className="hidden text-left lg:table-cell">Title</th>
        <th>AU</th>
        <th>Exam</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td></td>
        <td></td>
        <td className="hidden lg:table-cell"></td>
        <td className="text-center">0.0 AUs</td>
        <td></td>
      </tr>
    </tbody>
  </table>
)
