require('dotenv').config();

const mongoose = require('mongoose');

// ======================================================
// 1. MONGODB CONNECTION
// ======================================================

const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/shop_mongoose_db';


// ======================================================
// 2. USER SCHEMA
// ======================================================

const userSchema = new mongoose.Schema(
    {

        // --------------------------------------------------
        // Full name
        // --------------------------------------------------

        fullName: {
            type: String,
            required: [
                true,
                'Full name is required'
            ],
            trim: true,
            minlength: [
                2,
                'Full name must be at least 2 characters long'
            ]
        },


        // --------------------------------------------------
        // Email
        // --------------------------------------------------

        email: {
            type: String,
            required: [
                true,
                'Email is required'
            ],
            unique: true,
            lowercase: true,
            trim: true,

            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Invalid email format'
            ]
        },


        // --------------------------------------------------
        // Age
        // --------------------------------------------------

        age: {
            type: Number,

            min: [
                18,
                'User age must be at least 18'
            ],

            max: [
                100,
                'Invalid age'
            ]
        },


        // --------------------------------------------------
        // Phone
        // QUESTION 1
        // --------------------------------------------------

        phone: {
            type: String,

            validate: {
                validator: function (value) {

                    // Vietnamese mobile number:
                    // 03xxxxxxxx
                    // 05xxxxxxxx
                    // 07xxxxxxxx
                    // 08xxxxxxxx
                    // 09xxxxxxxx

                    return /^(03|05|07|08|09)\d{8}$/.test(value);
                },

                message: 'Invalid Vietnamese phone number'
            }
        },


        // --------------------------------------------------
        // Password
        // QUESTION 5
        // --------------------------------------------------

        password: {
            type: String,
            required: true
        },


        // --------------------------------------------------
        // Role
        // --------------------------------------------------

        role: {
            type: String,

            enum: [
                'user',
                'admin',
                'manager'
            ],

            default: 'user'
        },


        // --------------------------------------------------
        // Active status
        // --------------------------------------------------

        isActive: {
            type: Boolean,
            default: true
        },


        // --------------------------------------------------
        // Deleted status
        // QUESTION 4
        // --------------------------------------------------

        isDeleted: {
            type: Boolean,
            default: false
        }

    },
    {

        // Automatically create:
        // createdAt
        // updatedAt

        timestamps: true,


        // --------------------------------------------------
        // QUESTION 2
        // Include virtual fields in JSON
        // --------------------------------------------------

        toJSON: {
            virtuals: true
        },

        toObject: {
            virtuals: true
        }
    }
);


// ======================================================
// QUESTION 2
// VIRTUAL: displayInfo
// ======================================================

userSchema.virtual('displayInfo').get(function () {

    return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;

});


// ======================================================
// QUESTION 3
// STATIC METHOD
// findActiveByRole()
// ======================================================

userSchema.statics.findActiveByRole = function (roleName) {

    return this.find({
        role: roleName,
        isActive: true
    }).sort({
        fullName: 1
    });

};


// ======================================================
// QUESTION 4
// INSTANCE METHOD
// softDelete()
// ======================================================

userSchema.methods.softDelete = async function () {

    // Mark user as deleted

    this.isDeleted = true;

    // Also deactivate the account

    this.isActive = false;

    // Save changes

    return await this.save();

};


// ======================================================
// QUESTION 5
// PRE-SAVE MIDDLEWARE
// Simulate password hashing
// ======================================================

// IMPORTANT:
// Do NOT use next() here.
// This is an async/promise middleware.

userSchema.pre('save', async function () {

    console.log(
        `[Pre-save] Preparing user: ${this.fullName}`
    );

    // Only hash password when password is changed

    if (this.isModified('password')) {

        console.log(
            '[Pre-save] Password is being hashed...'
        );

        this.password =
            'hashed_' + this.password;
    }

});


// ======================================================
// QUESTION 5
// PRE-FIND MIDDLEWARE
// Hide soft-deleted users
// ======================================================

// IMPORTANT:
// Do NOT use next() here either.

userSchema.pre(/^find/, async function () {

    this.find({
        isDeleted: {
            $ne: true
        }
    });

});


// ======================================================
// 3. CREATE MODEL
// ======================================================

const User = mongoose.model(
    'User',
    userSchema
);


// ======================================================
// 4. MAIN FUNCTION
// ======================================================

async function main() {

    try {

        // ==================================================
        // CONNECT TO MONGODB
        // ==================================================

        console.log('Connecting to MongoDB...');

        await mongoose.connect(MONGO_URI);

        console.log(
            '✓ Connected to MongoDB successfully!'
        );

        console.log(
            'Database:',
            mongoose.connection.name
        );


        // ==================================================
        // CLEAR OLD DATA
        // ==================================================

        await User.deleteMany({});

        console.log(
            '✓ Old users removed'
        );


        // ==================================================
        // QUESTION 1
        // PHONE VALIDATION
        // ==================================================

        console.log('');

        console.log(
            '======================================'
        );

        console.log(
            'QUESTION 1 - PHONE VALIDATION'
        );

        console.log(
            '======================================'
        );


        // --------------------------------------------------
        // TEST VALID PHONE
        // --------------------------------------------------

        const validUser = new User({

            fullName:
                'Nguyen Van Hung',

            email:
                'hung.nguyen@example.com',

            age: 22,

            phone:
                '0912345678',

            password:
                '123456',

            role:
                'admin'
        });


        await validUser.save();


        console.log(
            '✓ Valid phone accepted'
        );


        // --------------------------------------------------
        // TEST INVALID PHONE
        // --------------------------------------------------

        try {

            const invalidUser = new User({

                fullName:
                    'Invalid Phone User',

                email:
                    'invalid@example.com',

                age:
                    22,

                phone:
                    '12345',

                password:
                    '123456',

                role:
                    'user'
            });


            await invalidUser.save();


            // If this line executes,
            // validation did NOT work.

            console.log(
                '❌ ERROR: Invalid phone was accepted'
            );

        }
        catch (error) {

            console.log(
                '✓ Invalid phone rejected'
            );

            console.log(
                'Error:',
                error.message
            );
        }


        // ==================================================
        // QUESTION 2
        // VIRTUAL displayInfo
        // ==================================================

        console.log('');

        console.log(
            '======================================'
        );

        console.log(
            'QUESTION 2 - VIRTUAL'
        );

        console.log(
            '======================================'
        );


        const userForVirtual =
            await User.findOne({
                email:
                    'hung.nguyen@example.com'
            });


        if (userForVirtual) {

            console.log(
                'displayInfo:',
                userForVirtual.displayInfo
            );


            console.log(
                'JSON:',
                userForVirtual.toJSON()
            );

        }


        // ==================================================
        // QUESTION 3
        // STATIC METHOD
        // ==================================================

        console.log('');

        console.log(
            '======================================'
        );

        console.log(
            'QUESTION 3 - STATIC METHOD'
        );

        console.log(
            '======================================'
        );


        // --------------------------------------------------
        // CREATE MORE USERS
        // --------------------------------------------------

        await User.create([

            {
                fullName:
                    'Tran Thi Mai',

                email:
                    'mai.tran@example.com',

                age:
                    25,

                phone:
                    '0987654321',

                password:
                    'abc123',

                role:
                    'admin'
            },


            {
                fullName:
                    'Le Van Nam',

                email:
                    'nam.le@example.com',

                age:
                    30,

                phone:
                    '0371234567',

                password:
                    'abc123',

                role:
                    'user'
            },


            {
                fullName:
                    'Pham Thi Lan',

                email:
                    'lan.pham@example.com',

                age:
                    28,

                phone:
                    '0851234567',

                password:
                    'abc123',

                role:
                    'admin',

                isActive:
                    false
            }

        ]);


        // --------------------------------------------------
        // CALL STATIC METHOD
        // --------------------------------------------------

        const activeAdmins =
            await User.findActiveByRole(
                'admin'
            );


        console.log(
            'Active admin users:'
        );


        console.table(

            activeAdmins.map(
                user => ({

                    fullName:
                        user.fullName,

                    email:
                        user.email,

                    role:
                        user.role,

                    isActive:
                        user.isActive

                })
            )

        );


        // ==================================================
        // QUESTION 4
        // SOFT DELETE
        // ==================================================

        console.log('');

        console.log(
            '======================================'
        );

        console.log(
            'QUESTION 4 - SOFT DELETE'
        );

        console.log(
            '======================================'
        );


        const userToDelete =
            await User.findOne({

                email:
                    'nam.le@example.com'

            });


        if (userToDelete) {

            console.log(
                'Before soft delete:'
            );


            console.log({

                fullName:
                    userToDelete.fullName,

                isActive:
                    userToDelete.isActive,

                isDeleted:
                    userToDelete.isDeleted

            });


            // --------------------------------------------------
            // SOFT DELETE
            // --------------------------------------------------

            await userToDelete.softDelete();


            console.log(
                'After soft delete:'
            );


            console.log({

                fullName:
                    userToDelete.fullName,

                isActive:
                    userToDelete.isActive,

                isDeleted:
                    userToDelete.isDeleted

            });

        }


        // ==================================================
        // QUESTION 5
        // MIDDLEWARE
        // ==================================================

        console.log('');

        console.log(
            '======================================'
        );

        console.log(
            'QUESTION 5 - MIDDLEWARE'
        );

        console.log(
            '======================================'
        );


        // --------------------------------------------------
        // TEST PRE-FIND MIDDLEWARE
        // --------------------------------------------------

        const allUsers =
            await User.find({});


        console.log(
            'Users returned by User.find():'
        );


        console.table(

            allUsers.map(
                user => ({

                    fullName:
                        user.fullName,

                    email:
                        user.email,

                    role:
                        user.role,

                    isActive:
                        user.isActive,

                    isDeleted:
                        user.isDeleted

                })
            )

        );


        console.log('');

        console.log(
            'Notice: soft-deleted users are hidden.'
        );


        // --------------------------------------------------
        // SHOW PASSWORD HASH RESULT
        // --------------------------------------------------

        const passwordTest =
            await User.findOne({
                email:
                    'hung.nguyen@example.com'
            });


        if (passwordTest) {

            console.log('');

            console.log(
                'Password after pre-save middleware:'
            );

            console.log(
                passwordTest.password
            );

        }


    }
    catch (error) {

        console.error('');

        console.error(
            '❌ Mongoose error:'
        );

        console.error(
            error
        );

    }
    finally {

        // ==================================================
        // CLOSE CONNECTION
        // ==================================================

        await mongoose.connection.close();

        console.log('');

        console.log(
            '✓ MongoDB connection closed.'
        );

    }

}


// ======================================================
// RUN PROGRAM
// ======================================================

main();