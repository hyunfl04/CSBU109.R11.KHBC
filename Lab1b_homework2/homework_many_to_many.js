const mongoose = require("mongoose");

// ========================================
// MONGODB CONNECTION
// ========================================

const MONGO_URI =
    "mongodb://127.0.0.1:27017/course_registration_db";

// ========================================
// 1. STUDENT SCHEMA
// ========================================

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ]
});

// ========================================
// 2. COURSE SCHEMA
// ========================================

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        }
    ],

    maxStudents: {
        type: Number,
        required: true,
        min: 1
    },

    availableSlots: {
        type: Number,
        required: true,
        min: 0
    }
});

// ========================================
// 3. MODELS
// ========================================

const Student = mongoose.model(
    "Student",
    studentSchema
);

const Course = mongoose.model(
    "Course",
    courseSchema
);

// ========================================
// 4. ENROLL COURSE
// ========================================

async function enrollCourse(studentId, courseId) {
    console.log("\n========================================");
    console.log("ENROLL COURSE");
    console.log("========================================");

    try {
        // ------------------------------------
        // Find student
        // ------------------------------------

        const student = await Student.findById(studentId);

        if (!student) {
            throw new Error("Student not found");
        }

        // ------------------------------------
        // Find course
        // ------------------------------------

        const course = await Course.findById(courseId);

        if (!course) {
            throw new Error("Course not found");
        }

        console.log("Student:", student.name);
        console.log("Course :", course.name);

        // ------------------------------------
        // Check already enrolled
        // ------------------------------------

        const alreadyEnrolled = student.courses.some(
            (id) => id.toString() === courseId.toString()
        );

        if (alreadyEnrolled) {
            throw new Error(
                "Student is already enrolled in this course"
            );
        }

        console.log("✓ Student is not enrolled yet");

        // ------------------------------------
        // Check available slots
        // ------------------------------------

        console.log(
            "Available slots:",
            course.availableSlots
        );

        if (course.availableSlots <= 0) {
            throw new Error(
                "Course has no available slots"
            );
        }

        console.log("✓ Course has available slots");

        // ------------------------------------
        // Add course to Student
        // ------------------------------------

        student.courses.push(course._id);

        // ------------------------------------
        // Add student to Course
        // ------------------------------------

        course.students.push(student._id);

        // ------------------------------------
        // Decrease available slots
        // ------------------------------------

        course.availableSlots -= 1;

        // ------------------------------------
        // Save changes
        // ------------------------------------

        await student.save();
        await course.save();

        console.log("✓ Student.courses updated");
        console.log("✓ Course.students updated");
        console.log(
            "✓ availableSlots decreased by 1"
        );

        console.log("\n========================================");
        console.log("✓ ENROLL SUCCESSFUL");
        console.log("========================================");

        return {
            success: true,
            studentId: student._id,
            courseId: course._id,
            availableSlots: course.availableSlots
        };

    } catch (error) {

        console.log("\n========================================");
        console.log("✗ ENROLL FAILED");
        console.log("========================================");

        console.log("Reason:", error.message);

        return {
            success: false,
            message: error.message
        };
    }
}

// ========================================
// 5. DROP COURSE
// ========================================

async function dropCourse(studentId, courseId) {
    console.log("\n========================================");
    console.log("DROP COURSE");
    console.log("========================================");

    try {
        // ------------------------------------
        // Find student
        // ------------------------------------

        const student = await Student.findById(studentId);

        if (!student) {
            throw new Error("Student not found");
        }

        // ------------------------------------
        // Find course
        // ------------------------------------

        const course = await Course.findById(courseId);

        if (!course) {
            throw new Error("Course not found");
        }

        console.log("Student:", student.name);
        console.log("Course :", course.name);

        // ------------------------------------
        // Check enrollment
        // ------------------------------------

        const enrolled = student.courses.some(
            (id) => id.toString() === courseId.toString()
        );

        if (!enrolled) {
            throw new Error(
                "Student is not enrolled in this course"
            );
        }

        console.log("✓ Student is enrolled");

        // ------------------------------------
        // Remove course from Student
        // ------------------------------------

        student.courses = student.courses.filter(
            (id) => id.toString() !== courseId.toString()
        );

        // ------------------------------------
        // Remove student from Course
        // ------------------------------------

        course.students = course.students.filter(
            (id) => id.toString() !== studentId.toString()
        );

        // ------------------------------------
        // Return one available slot
        // ------------------------------------

        course.availableSlots += 1;

        // ------------------------------------
        // Save changes
        // ------------------------------------

        await student.save();
        await course.save();

        console.log(
            "✓ Course removed from Student.courses"
        );

        console.log(
            "✓ Student removed from Course.students"
        );

        console.log(
            "✓ availableSlots increased by 1"
        );

        console.log("\n========================================");
        console.log("✓ DROP SUCCESSFUL");
        console.log("========================================");

        return {
            success: true,
            studentId: student._id,
            courseId: course._id,
            availableSlots: course.availableSlots
        };

    } catch (error) {

        console.log("\n========================================");
        console.log("✗ DROP FAILED");
        console.log("========================================");

        console.log("Reason:", error.message);

        return {
            success: false,
            message: error.message
        };
    }
}

// ========================================
// 6. DISPLAY DATABASE
// ========================================

async function displayDatabase() {
    console.log("\n========================================");
    console.log("CURRENT DATABASE");
    console.log("========================================");

    const students = await Student
        .find()
        .populate("courses");

    const courses = await Course
        .find()
        .populate("students");

    // ------------------------------------
    // Students
    // ------------------------------------

    console.log("\nSTUDENTS:");

    students.forEach((student) => {

        console.log("\nStudent:", student.name);
        console.log("Email:", student.email);

        if (student.courses.length === 0) {
            console.log("Courses: []");
        } else {
            console.log(
                "Courses:",
                student.courses.map(
                    (course) => course.name
                )
            );
        }
    });

    // ------------------------------------
    // Courses
    // ------------------------------------

    console.log("\nCOURSES:");

    courses.forEach((course) => {

        console.log("\nCourse:", course.name);

        console.log(
            "Max students:",
            course.maxStudents
        );

        console.log(
            "Available slots:",
            course.availableSlots
        );

        if (course.students.length === 0) {
            console.log("Students: []");
        } else {
            console.log(
                "Students:",
                course.students.map(
                    (student) => student.name
                )
            );
        }
    });
}

// ========================================
// 7. MAIN
// ========================================

async function main() {

    try {

        console.log("\n========================================");
        console.log("HOMEWORK 2");
        console.log("MONGOOSE MANY-TO-MANY");
        console.log("========================================");

        // ------------------------------------
        // Connect MongoDB
        // ------------------------------------

        await mongoose.connect(MONGO_URI);

        console.log("✓ MongoDB connected");
        console.log(
            "Database:",
            mongoose.connection.name
        );

        // ------------------------------------
        // Clear old data
        // ------------------------------------

        await Student.deleteMany({});
        await Course.deleteMany({});

        // ------------------------------------
        // Create students
        // ------------------------------------

        const student1 = await Student.create({
            name: "Nguyen Van An",
            email: "an@example.com",
            courses: []
        });

        const student2 = await Student.create({
            name: "Tran Thi Mai",
            email: "mai@example.com",
            courses: []
        });

        // ------------------------------------
        // Create courses
        // ------------------------------------

        const course1 = await Course.create({
            name: "Node.js Backend Development",
            students: [],
            maxStudents: 3,
            availableSlots: 3
        });

        const course2 = await Course.create({
            name: "MongoDB Database",
            students: [],
            maxStudents: 2,
            availableSlots: 2
        });

        console.log("\n✓ Test data created");

        console.log("\nStudents:");

        console.log(
            `- ${student1.name} | ${student1._id}`
        );

        console.log(
            `- ${student2.name} | ${student2._id}`
        );

        console.log("\nCourses:");

        console.log(
            `- ${course1.name} | ${course1._id} | Slots: ${course1.availableSlots}`
        );

        console.log(
            `- ${course2.name} | ${course2._id} | Slots: ${course2.availableSlots}`
        );

        // ====================================
        // QUESTION 1
        // ====================================

        const enrollResult = await enrollCourse(
            student1._id,
            course1._id
        );

        console.log("\nENROLL RESULT:");
        console.log(enrollResult);

        // ------------------------------------
        // Display after enroll
        // ------------------------------------

        await displayDatabase();

        // ====================================
        // QUESTION 2
        // ====================================

        const dropResult = await dropCourse(
            student1._id,
            course1._id
        );

        console.log("\nDROP RESULT:");
        console.log(dropResult);

        // ------------------------------------
        // Display after drop
        // ------------------------------------

        await displayDatabase();

        // ====================================
        // TEST DUPLICATE ENROLLMENT
        // ====================================

        console.log("\n========================================");
        console.log("TEST DUPLICATE ENROLLMENT");
        console.log("========================================");

        // Enroll first time
        await enrollCourse(
            student1._id,
            course1._id
        );

        // Enroll second time
        const duplicateResult = await enrollCourse(
            student1._id,
            course1._id
        );

        console.log("\nDUPLICATE RESULT:");
        console.log(duplicateResult);

        // ------------------------------------
        // Final database
        // ------------------------------------

        await displayDatabase();

    } catch (error) {

        console.error("\n✗ PROGRAM ERROR:");
        console.error(error);

    } finally {

        await mongoose.connection.close();

        console.log("\nMongoDB connection closed.");
    }
}

// ========================================
// RUN
// ========================================

main();