import { formatRemarks } from "../format"

describe("formatRemarks", () => {
  it('should return "Even Weeks" if remarks include "2,4,6"', () => {
    const remarks = "Some remarks including 2,4,6"
    expect(formatRemarks(remarks)).toBe("Even Weeks")
  })

  it('should return "Odd Weeks" if remarks include "1,3,5"', () => {
    const remarks = "Some remarks including 1,3,5"
    expect(formatRemarks(remarks)).toBe("Odd Weeks")
  })

  it('should remove "Teaching" from remarks', () => {
    const remarks = "Some remarks containing Teaching"
    expect(formatRemarks(remarks)).toBe("Some remarks containing ")
  })

  it("should not modify remarks if none of the conditions are met", () => {
    const remarks = "Some other remarks"
    expect(formatRemarks(remarks)).toBe(remarks)
  })
})
