import React from "react"

interface HelpConfig {
  question: React.ReactNode
  answer: React.ReactNode
}

export const HELP_CONFIG: HelpConfig[] = [
  {
    question: "What is this website for?",
    answer:
      "This website is for the students of the Nanyang Technological University to help them plan their timetable and see what courses/indexes are available in the upcoming terms"
  },
  {
    question: "How do I use this website?",
    answer:
      "On the stars page, click on the add course button, after which you can use the search bar to search for courses. Click on the course to see the indexes available for that course. After adding an index, the timetable will be updated automatically"
  },
  {
    question: "How does this help me in stars?",
    answer:
      "While we do not help track vacanies right now, we provide you a way to plan your courses and indexes before stars opens and allow you to share with your friends if you want to take the same index"
  },
  {
    question: "Can you update your system to include...?",
    answer: (
      <>
        We have updated the system for{" "}
        <span className="underline">Academic Year 2023-2024 Semester 2</span>.
        If you have any missing courses or suggestions, please feel free to
        email me
      </>
    )
  },
  {
    question: "Do you track my data?",
    answer:
      "We do track the number of users and user activity, but we do not track any of your personal data (we do not have access to it anyways)"
  }
]
