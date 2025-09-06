import Routine from '../models/Routine.js'
import Log from '../models/Log.js'

export async function saveRoutine(req,res){
  try{
    const data = { user: req.user.id, ...req.body }
    const routine = await Routine.findOneAndUpdate({ user:req.user.id }, data, { upsert:true, new:true, setDefaultsOnInsert:true })
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