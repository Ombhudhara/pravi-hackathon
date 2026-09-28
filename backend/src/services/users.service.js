import bcrypt from 'bcrypt';
import { User } from '../models/index.js';

export async function getUsers({ role, isActive, search, page = 1, limit = 10 }) {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.is_active = isActive === 'true';
  if (search) filter.$or = [
    { full_name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  const total = await User.countDocuments(filter);
  const offset = (page - 1) * limit;
  // Sort by is_active ascending (so false/pending is first), then by creation date descending
  const rows = await User.find(filter).select('full_name email role department is_active last_login_at created_at')
    .sort({ is_active: 1, created_at: -1 }).skip(offset).limit(Number(limit)).lean();

  return {
    data: rows.map(({ _id, ...row }) => ({ ...row, id: _id })),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function createUser({ full_name, email, role, department, password }) {
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ full_name, email: email.toLowerCase(), password_hash: hash, role, department });
  const result = user.toJSON();
  delete result.password_hash;
  return result;
}

export async function updateUser(id, updates, adminId) {
  const { full_name, role, department, is_active } = updates;
  
  const userToUpdate = await User.findById(id);
  if (!userToUpdate) throw new Error('NOT_FOUND');

  if (id === adminId && (is_active === false || role !== 'ADMIN')) {
    throw new Error('CANNOT_DEMOTE_SELF');
  }

  if (userToUpdate.role === 'ADMIN' && (is_active === false || role !== 'ADMIN')) {
    const adminCount = await User.countDocuments({ role: 'ADMIN', is_active: true });
    if (adminCount <= 1) {
      throw new Error('LAST_ADMIN');
    }
  }

  const changes = Object.fromEntries(Object.entries({ full_name, role, department, is_active }).filter(([, value]) => value !== undefined));
  if (Object.keys(changes).length === 0) return null;
  const updated = await User.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
    .select('full_name email role department is_active');
  return updated?.toJSON();
}

export async function resetUserPassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  const updated = await User.findByIdAndUpdate(id, { password_hash: hash });
  if (!updated) throw new Error('NOT_FOUND');
}
