import Reminder from '../models/Reminder.js'

export async function createReminder(req, res){
    const r = await Reminder.create({ ...req.body, user: req.user.id })
    res.json(r)
    }
    export async function listReminders(req, res){
    const items = await Reminder.find({ user: req.user.id }).populate('product')
    res.json(items)
    }
    export async function updateReminder(req, res){
    const r = await Reminder.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true }
    )
    res.json(r)
    }
    export async function deleteReminder(req, res){
    await Reminder.deleteOne({ _id: req.params.id, user: req.user.id })
    res.json({ ok: true })
}
