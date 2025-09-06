import User from '../models/User.js'
import Ticket from '../models/Ticket.js'

// Get admin dashboard statistics
export async function getDashboardStats(req, res) {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' })
    const totalDermatologists = await User.countDocuments({ role: 'dermatologist' })
    const totalAdmins = await User.countDocuments({ role: 'admin' })
    const totalTickets = await Ticket.countDocuments()
    const pendingTickets = await Ticket.countDocuments({ status: 'pending' })
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' })

    // Recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo },
      role: 'user'
    })

    res.json({
      users: {
        total: totalUsers,
        recent: recentUsers,
        dermatologists: totalDermatologists,
        admins: totalAdmins
      },
      tickets: {
        total: totalTickets,
        pending: pendingTickets,
        resolved: resolvedTickets
      },
      systemHealth: {
        status: 'operational',
        uptime: process.uptime()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all users for admin management
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, role, search } = req.query
    const skip = (page - 1) * limit

    let query = {}
    
    if (role && role !== 'all') {
      query.role = role
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update user role (Admin only)
export async function updateUserRole(req, res) {
  try {
    const { userId, newRole } = req.body

    const validRoles = ['user', 'dermatologist', 'admin']
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        validRoles
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: 'User role updated',
      user
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete user (Admin only)
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
