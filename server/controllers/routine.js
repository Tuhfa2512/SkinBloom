import Routine from '../models/Routine.js'
import Log from '../models/Log.js'

export async function saveRoutine(req,res){
  try{
    // Normalize steps to include product and optional productName
    const incoming = Array.isArray(req.body?.steps) ? req.body.steps : []
    const steps = incoming.map(s => ({
      product: s.product || null,
      productName: s.productName || undefined,
      note: s.note || '',
      timeOfDay: s.timeOfDay || 'AM'
    }))

    const data = { user: req.user.id, steps }
    const routine = await Routine.findOneAndUpdate(
      { user: req.user.id },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('steps.product')
    res.json(routine)
  }catch(e){ res.status(500).json({error:e.message}) }
}

export async function getRoutine(req,res){
  try{
    const routine = await Routine.findOne({ user:req.user.id }).populate('steps.product')
    res.json(routine)
  }catch(e){ res.status(500).json({error:e.message}) }
}

export async function logUsage(req,res){
  try{
    const log = await Log.create({ user:req.user.id, ...req.body })
    res.json(log)
  }catch(e){ res.status(500).json({error:e.message}) }
}

export async function getLogs(req,res){
  try{
    const logs = await Log.find({ user:req.user.id }).sort({ date:1 }).populate('usedSteps')
    res.json(logs)
  }catch(e){ res.status(500).json({error:e.message}) }
}