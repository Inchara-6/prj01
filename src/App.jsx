import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'records', label: 'Records' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

const teachers = [
  {
    id: 'FAC-2041',
    password: '123456',
    name: 'Dr. Megha Nair',
    dept: 'CSE',
    subjects: ['Database Systems', 'Operating Systems'],
    upcomingClasses: [
      { day: 'Monday', time: '09:00 AM', section: 'CSE-A', subject: 'Database Systems', room: 'Room 204' },
      { day: 'Wednesday', time: '09:00 AM', subject: 'Database Systems', section: 'CSE-A', room: 'Room 204' },
      { day: 'Friday', time: '11:00 AM', subject: 'Operating Systems', section: 'CSE-A', room: 'Room 305' },
    ],
  },
  {
    id: 'FAC-2042',
    password: 'admin123',
    name: 'Prof. Arjun Rao',
    dept: 'ECE',
    subjects: ['Digital Electronics', 'VLSI'],
    upcomingClasses: [
      { day: 'Tuesday', time: '11:00 AM', section: 'ECE-B', subject: 'Digital Electronics', room: 'Room 118' },
      { day: 'Thursday', time: '01:00 PM', section: 'ECE-A', subject: 'VLSI', room: 'Lab 3' },
    ],
  },
  {
    id: 'FAC-2043',
    password: 'teach456',
    name: 'Dr. Kavya Iyer',
    dept: 'IT',
    subjects: ['Web Technologies', 'Cloud Computing'],
    upcomingClasses: [
      { day: 'Tuesday', time: '10:00 AM', section: 'IT-A', subject: 'Web Technologies', room: 'Lab 2' },
      { day: 'Thursday', time: '02:00 PM', section: 'IT-B', subject: 'Cloud Computing', room: 'Room 303' },
    ],
  },
  {
    id: 'FAC-2044',
    password: 'faculty789',
    name: 'Prof. Rajesh Kumar',
    dept: 'CSE',
    subjects: ['AI & ML', 'Software Engineering'],
    upcomingClasses: [
      { day: 'Monday', time: '11:00 AM', section: 'CSE-B', subject: 'AI & ML', room: 'Room 405' },
      { day: 'Friday', time: '10:00 AM', section: 'CSE-A', subject: 'Software Engineering', room: 'Room 212' },
    ],
  },
  {
    id: 'DBMS-101',
    password: 'dbms123',
    name: 'Dr. Asha Verma',
    dept: 'CSE',
    subjects: ['Database Systems'],
    upcomingClasses: [
      { day: 'Monday', time: '09:00 AM', section: 'CSE-A', subject: 'Database Systems', room: 'Room 204' },
      { day: 'Wednesday', time: '09:00 AM', section: 'CSE-A', subject: 'Database Systems', room: 'Room 204' },
      { day: 'Friday', time: '09:00 AM', section: 'CSE-B', subject: 'Database Systems', room: 'Room 204' },
    ],
  },
]

const teacherClassAssignments = {
  'Dr. Megha Nair': [
    'CSE-A / Sem 4 / Database Systems',
    'CSE-A / Sem 4 / Operating Systems',
  ],
  'Prof. Arjun Rao': [
    'ECE-B / Sem 4 / Digital Electronics',
    'ECE-A / Sem 4 / VLSI',
  ],
  'Dr. Kavya Iyer': [
    'IT-A / Sem 4 / Web Technologies',
    'IT-B / Sem 4 / Cloud Computing',
  ],
  'Prof. Rajesh Kumar': [
    'CSE-B / Sem 4 / AI & ML',
    'CSE-A / Sem 6 / Software Engineering',
  ],
  'Dr. Asha Verma': [
    'CSE-A / Sem 4 / Database Systems',
    'CSE-B / Sem 4 / Database Systems',
  ],
}

const classOptions = [
  'CSE-A / Sem 4 / Database Systems',
  'CSE-A / Sem 4 / Operating Systems',
  'CSE-B / Sem 4 / Database Systems',
  'CSE-B / Sem 4 / Computer Networks',
  'CSE-A / Sem 6 / Software Engineering',
  'CSE-B / Sem 6 / AI & ML',
  'ECE-B / Sem 4 / Digital Electronics',
  'ECE-A / Sem 4 / VLSI',
  'IT-A / Sem 4 / Web Technologies',
  'IT-B / Sem 4 / Cloud Computing',
]

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getClassKey = (department, section, semester) => `${department}-${section}-${semester}`

const weeklyTimetable = {
  'CSE-A-4': {
    Monday: [
      { time: '09:00 AM', subject: 'Database Systems', room: 'Room 204' },
      { time: '11:00 AM', subject: 'Operating Systems', room: 'Room 305' },
      { time: '02:00 PM', subject: 'Discrete Mathematics', room: 'Room 101' },
    ],
    Tuesday: [
      { time: '09:00 AM', subject: 'Data Structures', room: 'Room 214' },
      { time: '11:00 AM', subject: 'Web Technologies', room: 'Lab 2' },
    ],
    Wednesday: [
      { time: '09:00 AM', subject: 'Database Systems', room: 'Room 204' },
      { time: '01:00 PM', subject: 'Operating Systems Lab', room: 'Lab 1' },
    ],
    Thursday: [
      { time: '10:00 AM', subject: 'Computer Architecture', room: 'Room 201' },
      { time: '02:00 PM', subject: 'Software Lab', room: 'Lab 3' },
    ],
    Friday: [
      { time: '09:00 AM', subject: 'Data Structures', room: 'Room 214' },
      { time: '11:00 AM', subject: 'Database Systems', room: 'Room 204' },
    ],
    Saturday: [{ time: '09:30 AM', subject: 'Mentoring Session', room: 'Seminar Hall' }],
  },
  'CSE-B-4': {
    Monday: [
      { time: '09:00 AM', subject: 'Computer Networks', room: 'Lab 2' },
      { time: '11:00 AM', subject: 'Operating Systems', room: 'Room 305' },
    ],
    Tuesday: [
      { time: '09:00 AM', subject: 'Digital Logic', room: 'Room 118' },
      { time: '01:00 PM', subject: 'Database Systems', room: 'Room 204' },
    ],
    Wednesday: [
      { time: '10:00 AM', subject: 'Web Technologies', room: 'Lab 2' },
      { time: '02:00 PM', subject: 'Computer Networks', room: 'Lab 2' },
    ],
    Thursday: [
      { time: '09:00 AM', subject: 'Operating Systems', room: 'Room 305' },
      { time: '11:00 AM', subject: 'Data Structures', room: 'Room 214' },
    ],
    Friday: [
      { time: '09:00 AM', subject: 'DBMS Lab', room: 'Lab 4' },
      { time: '01:00 PM', subject: 'Communication Skills', room: 'Room 110' },
    ],
    Saturday: [{ time: '09:30 AM', subject: 'Remedial Class', room: 'Room 220' }],
  },
  'CSE-A-6': {
    Monday: [
      { time: '09:00 AM', subject: 'Software Engineering', room: 'Room 212' },
      { time: '11:00 AM', subject: 'Machine Learning', room: 'Lab 5' },
    ],
    Tuesday: [
      { time: '09:00 AM', subject: 'Compiler Design', room: 'Room 210' },
      { time: '01:00 PM', subject: 'Cloud Computing', room: 'Room 303' },
    ],
    Wednesday: [
      { time: '10:00 AM', subject: 'Software Engineering', room: 'Room 212' },
      { time: '02:00 PM', subject: 'ML Lab', room: 'Lab 5' },
    ],
    Thursday: [
      { time: '09:00 AM', subject: 'Advanced DBMS', room: 'Room 312' },
      { time: '11:00 AM', subject: 'Mobile App Lab', room: 'Lab 3' },
    ],
    Friday: [
      { time: '09:00 AM', subject: 'Project Review', room: 'Room 410' },
      { time: '01:00 PM', subject: 'Seminar', room: 'Seminar Hall' },
    ],
    Saturday: [{ time: '09:30 AM', subject: 'Tutorial Support', room: 'Room 212' }],
  },
  'CSE-B-6': {
    Monday: [
      { time: '09:00 AM', subject: 'AI & ML', room: 'Room 405' },
      { time: '11:00 AM', subject: 'IoT', room: 'Lab 6' },
    ],
    Tuesday: [
      { time: '09:00 AM', subject: 'Big Data', room: 'Room 302' },
      { time: '02:00 PM', subject: 'Deep Learning', room: 'Lab 5' },
    ],
    Wednesday: [
      { time: '10:00 AM', subject: 'AI & ML', room: 'Room 405' },
      { time: '01:00 PM', subject: 'Internet of Things Lab', room: 'Lab 6' },
    ],
    Thursday: [
      { time: '09:00 AM', subject: 'Security', room: 'Room 204' },
      { time: '11:00 AM', subject: 'Project Guidance', room: 'Room 410' },
    ],
    Friday: [
      { time: '09:00 AM', subject: 'Research Trends', room: 'Room 308' },
      { time: '01:00 PM', subject: 'Capstone Review', room: 'Seminar Hall' },
    ],
    Saturday: [{ time: '09:30 AM', subject: 'Career Mentoring', room: 'Room 402' }],
  },
}

const initialStudents = [
  { id: 1, name: 'Aarav Sharma', rollNo: 'CS-21', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 2, name: 'Diya Nair', rollNo: 'CS-22', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Absent' },
  { id: 3, name: 'Kabir Singh', rollNo: 'CS-23', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 4, name: 'Meera Iyer', rollNo: 'CS-24', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 5, name: 'Rohit Verma', rollNo: 'CS-25', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Absent' },
  { id: 6, name: 'Sneha Reddy', rollNo: 'CS-26', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 7, name: 'Aditya Kulkarni', rollNo: 'CS-27', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Absent' },
  { id: 8, name: 'Pooja Menon', rollNo: 'CS-28', dept: 'CSE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 9, name: 'Harsh Vyas', rollNo: 'CS-31', dept: 'CSE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 10, name: 'Nisha Thomas', rollNo: 'CS-32', dept: 'CSE', year: 2, semester: 4, section: 'B', status: 'Absent' },
  { id: 11, name: 'Varun Nair', rollNo: 'CS-33', dept: 'CSE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 12, name: 'Kavya Menon', rollNo: 'CS-34', dept: 'CSE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 13, name: 'Yash Rao', rollNo: 'EC-21', dept: 'ECE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 14, name: 'Ananya Pillai', rollNo: 'EC-22', dept: 'ECE', year: 2, semester: 4, section: 'A', status: 'Absent' },
  { id: 15, name: 'Rohan Das', rollNo: 'EC-23', dept: 'ECE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 16, name: 'Sana K', rollNo: 'EC-24', dept: 'ECE', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 17, name: 'Ishaan Bose', rollNo: 'EC-25', dept: 'ECE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 18, name: 'Leah Susan', rollNo: 'EC-26', dept: 'ECE', year: 2, semester: 4, section: 'B', status: 'Absent' },
  { id: 19, name: 'Vikram Iyer', rollNo: 'EC-27', dept: 'ECE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 20, name: 'Priya Mohan', rollNo: 'EC-28', dept: 'ECE', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 21, name: 'Aditi Rao', rollNo: 'IT-21', dept: 'IT', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 22, name: 'Nikhil Joshi', rollNo: 'IT-22', dept: 'IT', year: 2, semester: 4, section: 'A', status: 'Absent' },
  { id: 23, name: 'Mira Shah', rollNo: 'IT-23', dept: 'IT', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 24, name: 'Ritvik Sen', rollNo: 'IT-24', dept: 'IT', year: 2, semester: 4, section: 'A', status: 'Present' },
  { id: 25, name: 'Sanvi Nair', rollNo: 'IT-25', dept: 'IT', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 26, name: 'Ethan Babu', rollNo: 'IT-26', dept: 'IT', year: 2, semester: 4, section: 'B', status: 'Absent' },
  { id: 27, name: 'Rhea Kumar', rollNo: 'IT-27', dept: 'IT', year: 2, semester: 4, section: 'B', status: 'Present' },
  { id: 28, name: 'Tarun S', rollNo: 'IT-28', dept: 'IT', year: 2, semester: 4, section: 'B', status: 'Present' },
]

const defaultAttendanceRecords = [
  { id: 1, date: '29 Aug 2026', subject: 'Database Systems', section: 'CSE-A', present: 34, absent: 3, rate: 92, teacherName: 'Dr. Asha Verma' },
  { id: 2, date: '28 Aug 2026', subject: 'Operating Systems', section: 'CSE-A', present: 31, absent: 5, rate: 86, teacherName: 'Dr. Megha Nair' },
  { id: 3, date: '27 Aug 2026', subject: 'Networking', section: 'CSE-B', present: 29, absent: 7, rate: 81, teacherName: 'Prof. Rajesh Kumar' },
  { id: 4, date: '26 Aug 2026', subject: 'Web Technology', section: 'IT-A', present: 33, absent: 4, rate: 89, teacherName: 'Dr. Kavya Iyer' },
]

const reports = [
  { title: 'CSE-A Database Systems', value: '92%', detail: 'Good attendance' },
  { title: 'CSE-B Web Tech', value: '78%', detail: 'Needs review' },
  { title: 'Semester 4 overall', value: '84%', detail: 'Stable' },
]

const attendanceStates = ['Present', 'Absent']

const normalizeKey = (value) => value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const getMatchingValue = (row, fieldNames) => {
  const matchingKey = Object.keys(row).find((key) => fieldNames.includes(normalizeKey(key)))

  if (!matchingKey) {
    return ''
  }

  return String(row[matchingKey] ?? '').trim()
}

const parseStudentRow = (row, index) => {
  const name = getMatchingValue(row, ['name', 'studentname', 'fullname', 'student']) || `Student ${index + 1}`
  const rollNo = getMatchingValue(row, ['rollno', 'rollnumber', 'roll', 'studentid', 'id']) || `ST-${index + 1}`
  const dept = getMatchingValue(row, ['department', 'dept', 'branch', 'program']) || 'General'
  const yearValue = getMatchingValue(row, ['year', 'yearofstudy'])
  const semesterValue = getMatchingValue(row, ['semester', 'sem'])
  const section = getMatchingValue(row, ['section', 'sec', 'classsection']) || 'A'

  return {
    id: Date.now() + index + 1,
    name,
    rollNo,
    dept,
    year: Number.parseInt(yearValue.match(/\d+/)?.[0] ?? '1', 10) || 1,
    semester: Number.parseInt(semesterValue.match(/\d+/)?.[0] ?? '1', 10) || 1,
    section,
    status: 'Present',
  }
}

async function readStudentExcel(file) {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (!rows.length) {
    throw new Error('The uploaded file has no student rows.')
  }

  const validRows = rows.filter((row) =>
    Object.keys(row).some((key) => String(row[key] ?? '').trim().length > 0),
  )

  if (!validRows.length) {
    throw new Error('No valid student data was found in the uploaded file.')
  }

  return validRows.map(parseStudentRow)
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentTeacher, setCurrentTeacher] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [loginForm, setLoginForm] = useState({ teacherId: 'FAC-2041', password: '123456' })
  const [selectedClass, setSelectedClass] = useState(classOptions[0])
  const [students, setStudents] = useState(initialStudents)
  const [weeklyTimetableData, setWeeklyTimetableData] = useState(weeklyTimetable)
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('No file selected')
  const [uploadError, setUploadError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showTimetableEditor, setShowTimetableEditor] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState(defaultAttendanceRecords)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    time: '09:00 AM',
    subject: '',
    room: '',
  })
  const fileInputRef = useRef(null)

  const teacherClassOptions = useMemo(
    () => (currentTeacher ? teacherClassAssignments[currentTeacher.name] || [] : classOptions),
    [currentTeacher],
  )

  useEffect(() => {
    if (!currentTeacher) {
      return
    }

    const validClasses = teacherClassAssignments[currentTeacher.name] || []

    if (validClasses.length && !validClasses.includes(selectedClass)) {
      setSelectedClass(validClasses[0])
    }
  }, [currentTeacher, selectedClass])

  const { section, department, semester, year } = useMemo(() => {
    const match = selectedClass.match(/([A-Z]+)-([A-Z])\s*\/\s*Sem\s*(\d+)/i)

    if (!match) {
      return { department: 'CSE', section: 'A', semester: 4, year: 2 }
    }

    const [, dept, sec, sem] = match
    return {
      department: dept,
      section: sec,
      semester: Number.parseInt(sem, 10) || 4,
      year: 2,
    }
  }, [selectedClass])

  const selectedTimetable = useMemo(() => {
    const key = getClassKey(department, section, semester)
    const timetable = weeklyTimetableData[key] || weeklyTimetableData['CSE-A-4'] || {}

    if (!currentTeacher || !teacherClassAssignments[currentTeacher.name]) {
      return timetable
    }

    const teacherSubjects = teacherClassAssignments[currentTeacher.name].map((entry) =>
      entry.split(' / ').slice(2).join(' / '),
    )

    return Object.fromEntries(
      Object.entries(timetable).map(([day, slots]) => [
        day,
        (slots || []).filter((slot) => teacherSubjects.includes(slot.subject)),
      ]),
    )
  }, [currentTeacher, department, section, semester, weeklyTimetableData])

  const displayStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.dept.toUpperCase() === department.toUpperCase() &&
          student.section.toUpperCase() === section.toUpperCase() &&
          student.semester === semester,
      ),
    [department, section, semester, students],
  )

  const presentCount = useMemo(
    () => displayStudents.filter((student) => student.status === 'Present').length,
    [displayStudents],
  )

  const absentCount = useMemo(
    () => displayStudents.filter((student) => student.status === 'Absent').length,
    [displayStudents],
  )

  const attendanceRate = useMemo(() => {
    if (!displayStudents.length) {
      return 0
    }

    return Math.round((presentCount / displayStudents.length) * 100)
  }, [displayStudents.length, presentCount])

  const handleLogin = (event) => {
    event.preventDefault()

    const teacherIdOrName = loginForm.teacherId.trim().toLowerCase()

    const teacher = teachers.find((entry) => {
      const matchesId = entry.id.toLowerCase() === teacherIdOrName
      const matchesName = entry.name.toLowerCase() === teacherIdOrName
      const matchesNamePart = entry.name.toLowerCase().includes(teacherIdOrName)

      return (matchesId || matchesName || matchesNamePart) && entry.password === loginForm.password
    })

    if (!teacher) {
      setLoginError('Invalid Teacher ID or password. Use one of the demo teacher accounts.')
      setMessage('')
      return
    }

    setCurrentTeacher(teacher)
    setLoggedIn(true)
    setLoginError('')
    setMessage(`Welcome ${teacher.name}.`)
  }

  const handleStatusChange = (id, status) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === id ? { ...student, status } : student,
      ),
    )
  }

  const markAll = (status) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({ ...student, status })),
    )
  }

  const addTimetableSlot = () => {
    const trimmedSubject = timetableForm.subject.trim()
    const trimmedRoom = timetableForm.room.trim()

    if (!trimmedSubject || !trimmedRoom) {
      setMessage('Please enter a subject and room before saving the timetable slot.')
      return
    }

    const key = getClassKey(department, section, semester)

    setWeeklyTimetableData((currentTimetable) => {
      const existingDay = currentTimetable[key]?.[timetableForm.day] || []
      const nextEntries = [...existingDay]
      const matchIndex = nextEntries.findIndex((entry) => entry.time === timetableForm.time)

      if (matchIndex >= 0) {
        nextEntries[matchIndex] = {
          time: timetableForm.time,
          subject: trimmedSubject,
          room: trimmedRoom,
        }
      } else {
        nextEntries.push({
          time: timetableForm.time,
          subject: trimmedSubject,
          room: trimmedRoom,
        })
      }

      return {
        ...currentTimetable,
        [key]: {
          ...(currentTimetable[key] || {}),
          [timetableForm.day]: nextEntries,
        },
      }
    })

    setMessage(`Timetable updated for ${department}-${section} / Sem ${semester}.`)
    setTimetableForm((current) => ({ ...current, subject: '', room: '' }))
  }

  const deleteTimetableSlot = (day, time) => {
    const key = getClassKey(department, section, semester)

    setWeeklyTimetableData((currentTimetable) => {
      const nextDaySlots = (currentTimetable[key]?.[day] || []).filter((slot) => slot.time !== time)

      return {
        ...currentTimetable,
        [key]: {
          ...(currentTimetable[key] || {}),
          [day]: nextDaySlots,
        },
      }
    })

    setMessage(`Removed a timetable entry for ${day}.`)
  }

  const visibleRecords = useMemo(
    () =>
      attendanceRecords.filter(
        (record) => !currentTeacher || record.teacherName === currentTeacher.name,
      ),
    [attendanceRecords, currentTeacher],
  )

  const teacherReports = useMemo(() => {
    if (!currentTeacher) {
      return reports
    }

    const teacherSubjects = teacherClassAssignments[currentTeacher.name] || []

    return teacherSubjects.map((className, index) => {
      const subjectName = className.split(' / ').slice(2).join(' / ') || className
      const detail = index === 0 ? 'Teacher-specific attendance' : 'Class performance'
      const badgeValue =
        subjectName.includes('Database') ? '92%' :
        subjectName.includes('Operating') ? '86%' :
        subjectName.includes('Digital') ? '88%' :
        subjectName.includes('VLSI') ? '90%' :
        subjectName.includes('Web') ? '89%' :
        subjectName.includes('Cloud') ? '84%' :
        subjectName.includes('AI') ? '82%' :
        subjectName.includes('Software') ? '87%' :
        '85%'

      return {
        title: className,
        value: badgeValue,
        detail,
      }
    })
  }, [currentTeacher])

  const saveAttendance = () => {
    const subjectName = selectedClass.split(' / ').slice(2).join(' / ') || selectedClass
    const record = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      subject: subjectName,
      section: `${department}-${section}`,
      present: presentCount,
      absent: absentCount,
      rate: displayStudents.length ? Math.round((presentCount / displayStudents.length) * 100) : 0,
      teacherName: currentTeacher?.name || 'Unknown Teacher',
    }

    setAttendanceRecords((current) => [record, ...current].slice(0, 5))
    setMessage(`Attendance saved for ${selectedClass}. Present: ${presentCount}, Absent: ${absentCount}.`)
  }

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploadError('')

    try {
      const importedStudents = await readStudentExcel(file)

      setStudents(importedStudents)
      setFileName(file.name)
      setMessage(`Imported ${importedStudents.length} students from ${file.name}.`)
      setActiveView('attendance')
    } catch (error) {
      setUploadError(error.message || 'Unable to read the Excel file.')
      setMessage('')
    }

    event.target.value = ''
  }

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-block">
            <span className="brand-badge">ED</span>
            <div>
              <p className="eyebrow">Faculty Portal</p>
              <h1>EduTrack</h1>
            </div>
          </div>

          <h2>Teacher Login</h2>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Teacher ID
              <input
                type="text"
                value={loginForm.teacherId}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, teacherId: event.target.value }))
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            <button type="submit" className="primary-btn">Login</button>
          </form>

          {loginError && <p className="error-text">{loginError}</p>}

          <div className="login-footer">
            <span>Demo accounts:</span>
            <div className="teacher-list">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  className="demo-account"
                  onClick={() => setLoginForm({ teacherId: teacher.name, password: teacher.password })}
                >
                  {teacher.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block sidebar-brand">
          <span className="brand-badge">ED</span>
          <div>
            <p className="eyebrow">Faculty</p>
            <h3>EduTrack</h3>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Good morning</p>
            <h2>{activeView === 'dashboard' ? 'Teacher Dashboard' : 'Faculty Workspace'}</h2>
          </div>

          <div className="topbar-actions">
            <div className="notifications-wrapper">
              <button className="outline-btn" type="button" onClick={() => setNotificationsOpen((value) => !value)}>
                Notifications
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-header">
                    <strong>Alerts</strong>
                  </div>
                  <div className="notification-item">
                    <strong>DBMS review</strong>
                    <small>{currentTeacher?.name || 'Teacher'}: 2 classes pending today.</small>
                  </div>
                  <div className="notification-item">
                    <strong>Attendance</strong>
                    <small>{selectedClass} • {presentCount} present / {absentCount} absent.</small>
                  </div>
                </div>
              )}
            </div>
            <div className="teacher-profile">
              <div className="profile-avatar">{currentTeacher?.name.slice(0, 2).toUpperCase() || 'TN'}</div>
              <div>
                <strong>{currentTeacher?.name || 'Teacher'}</strong>
                <small>{currentTeacher?.dept || 'Department'}</small>
              </div>
            </div>
            <button
              className="ghost-btn"
              onClick={() => {
                setLoggedIn(false)
                setCurrentTeacher(null)
                setMessage('')
              }}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <>
            <section className="hero-panel">
              <div>
                <p className="eyebrow">Today</p>
                <h3>Class overview</h3>
              </div>

              <div className="quick-actions">
                <button className="primary-btn" type="button" onClick={() => setActiveView('attendance')}>Mark Attendance</button>
                <button className="outline-btn" type="button">Face Recognition</button>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Present today</span>
                <strong>{presentCount} / {displayStudents.length}</strong>
              </div>
              <div className="stat-card">
                <span>Absent students</span>
                <strong>{absentCount}</strong>
              </div>
              <div className="stat-card">
                <span>Avg. attendance</span>
                <strong>{attendanceRate}%</strong>
              </div>
              <div className="stat-card">
                <span>Low attendance alerts</span>
                <strong>{Math.max(0, 2 - absentCount)}</strong>
              </div>
            </section>

            <section className="upcoming-panel card">
              <div className="card-header">
                <h3>Upcoming classes for {currentTeacher?.name || 'this teacher'}</h3>
              </div>

              <div className="upcoming-list">
                {(currentTeacher?.upcomingClasses || []).map((slot, index) => (
                  <div key={`${slot.day}-${slot.time}-${index}`} className="upcoming-item">
                    <div>
                      <strong>{slot.subject}</strong>
                      <small>{slot.section}</small>
                    </div>
                    <span>{slot.day}</span>
                    <span>{slot.time}</span>
                    <small>{slot.room}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-grid">
              <div className="card timetable-card">
                <div className="card-header">
                  <h3>Weekly timetable</h3>
                  <div className="table-actions">
                    <span className="chip success">{department}-{section} / Sem {semester}</span>
                    <button className="outline-btn" type="button" onClick={() => setShowTimetableEditor((value) => !value)}>
                      {showTimetableEditor ? 'Hide editor' : 'Edit timetable'}
                    </button>
                  </div>
                </div>

                {showTimetableEditor && (
                  <div className="timetable-editor">
                    <div className="editor-row">
                      <label>
                        Day
                        <select
                          value={timetableForm.day}
                          onChange={(event) => setTimetableForm((current) => ({ ...current, day: event.target.value }))}
                        >
                          {weekDays.map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Time
                        <input
                          type="text"
                          value={timetableForm.time}
                          onChange={(event) => setTimetableForm((current) => ({ ...current, time: event.target.value }))}
                        />
                      </label>

                      <label>
                        Subject
                        <input
                          type="text"
                          value={timetableForm.subject}
                          onChange={(event) => setTimetableForm((current) => ({ ...current, subject: event.target.value }))}
                        />
                      </label>

                      <label>
                        Room
                        <input
                          type="text"
                          value={timetableForm.room}
                          onChange={(event) => setTimetableForm((current) => ({ ...current, room: event.target.value }))}
                        />
                      </label>

                      <button className="primary-btn" type="button" onClick={addTimetableSlot}>Add slot</button>
                    </div>
                  </div>
                )}

                <div className="day-grid">
                  {weekDays.map((day) => (
                    <div key={day} className="timetable-day">
                      <h4>{day}</h4>
                      {(selectedTimetable[day] || []).map((slot) => (
                        <div key={`${day}-${slot.time}`} className="timetable-slot">
                          <div className="slot-header">
                            <strong>{slot.subject}</strong>
                            <button type="button" className="delete-icon" onClick={() => deleteTimetableSlot(day, slot.time)}>×</button>
                          </div>
                          <span>{slot.time}</span>
                          <small>{slot.room}</small>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card class-card">
                <div className="card-header">
                  <h3>Class selection</h3>
                </div>

                <label>
                  Subject / Class
                  <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                    {teacherClassOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="meta-row">
                  <div>
                    <span>Department</span>
                    <strong>{department}</strong>
                  </div>
                  <div>
                    <span>Year</span>
                    <strong>{year}nd Year</strong>
                  </div>
                  <div>
                    <span>Semester</span>
                    <strong>{semester}th</strong>
                  </div>
                </div>

                <button className="primary-btn full-width" type="button" onClick={() => setActiveView('attendance')}>Continue to attendance</button>
              </div>
            </section>
          </>
        )}

        {activeView === 'attendance' && (
          <section className="card attendance-card">
            <div className="card-header attendance-header">
              <div>
                <h3>Attendance for {selectedClass}</h3>
                <p>Student list • Date: 29 Aug 2026</p>
              </div>

              <div className="attendance-tools">
                <button className="outline-btn" type="button" onClick={() => markAll('Present')}>Mark all present</button>
                <button className="outline-btn" type="button" onClick={() => markAll('Absent')}>Mark all absent</button>
                <button className="ghost-btn" type="button">Face recognition</button>
              </div>
            </div>

            <div className="proxy-banner">
              Proxy prevention enabled: one mark per student, session lock, teacher verification required before final save.
            </div>

            <div className="attendance-list">
              {displayStudents.length === 0 ? (
                <div className="empty-state">
                  No students found for {department}-{section} / Sem {semester}. Upload a section-wise Excel sheet or add students for this class.
                </div>
              ) : (
                displayStudents.map((student) => (
                  <div key={student.id} className="student-row">
                    <div className="student-info">
                      <div className="student-avatar">{student.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong>{student.name}</strong>
                        <p>
                          {student.dept} • {student.year}Y • Sem {student.semester} • Sec {student.section}
                        </p>
                      </div>
                    </div>

                    <div className="student-meta">
                      <span>Roll No: {student.rollNo}</span>
                    </div>

                    <div className="status-buttons">
                      {attendanceStates.map((state) => (
                        <button
                          key={state}
                          type="button"
                          className={student.status === state ? 'status-btn active' : 'status-btn'}
                          onClick={() => handleStatusChange(student.id, state)}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="save-row">
              <span className="save-message">{message}</span>
              <button className="primary-btn" type="button" onClick={saveAttendance}>Save attendance</button>
            </div>
          </section>
        )}

        {activeView === 'records' && (
          <section className="card records-panel">
            <div className="card-header">
              <h3>Recent attendance records</h3>
            </div>

            <ul className="simple-list">
              {visibleRecords.map((record) => (
                <li key={record.id} className="record-item">
                  <div>
                    <span>{record.date}</span>
                    <strong>{record.subject}</strong>
                    <small>{record.section}</small>
                    <small>{record.teacherName}</small>
                  </div>
                  <div className="record-figures">
                    <span>{record.present} Present</span>
                    <strong>{record.rate}%</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeView === 'reports' && (
          <section className="card reports-panel">
            <div className="card-header">
              <h3>Attendance reports</h3>
            </div>

            <div className="report-list">
              {teacherReports.map((report) => (
                <div key={report.title} className="report-item">
                  <div>
                    <strong>{report.title}</strong>
                    <small>{report.detail}</small>
                  </div>
                  <span>{report.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="settings-panel">
            <div className="card settings-card">
              <div className="card-header">
                <h3>Student data import</h3>
              </div>

              <p className="settings-text">
                Upload a section-wise Excel or CSV file. The app matches students by department, semester, and section so the same Excel can later support face-recognition enrollment.
              </p>

              <div className="upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  hidden
                />
                <button className="primary-btn" type="button" onClick={() => fileInputRef.current?.click()}>
                  Upload Excel Sheet
                </button>
                <div className="upload-meta">
                  <span>Selected file:</span>
                  <strong>{fileName}</strong>
                </div>
              </div>

              {uploadError && <p className="error-text">{uploadError}</p>}

              <div className="helper-box">
                <strong>Expected columns:</strong>
                <ul>
                  <li>Name</li>
                  <li>Roll No / Student ID</li>
                  <li>Department</li>
                  <li>Year</li>
                  <li>Semester</li>
                  <li>Section</li>
                  <li>Face ID / Photo File (optional for future recognition)</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
