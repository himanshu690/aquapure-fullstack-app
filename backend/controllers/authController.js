import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        id: `USR${Date.now().toString().slice(-4)}`,
        name,
        email,
        password,
        phone,
        address,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
           user: {
            _id: user._id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
           },
            token: generateToken(user.id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};


export { registerUser, loginUser, getUserProfile };