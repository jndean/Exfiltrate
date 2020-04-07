
var lobby_message = "> Connecting to www.dark.net/exfil.EXE\n> pr0xy: blitting registers - <b><font color=\"#22ff22\">[SUCCESS]</font></b>\n> Rasterising backdoor.jpg ... <b><font color=\"22ff22\">[SUCCESS]</font></b>\n> Spoofing creds ... <b><font color=\"#ee2211\">[FAILED]</font></b> - Users Detected!\n> Initialising mode -1 (MANUAL)\n> Enter your name: ";



function othersDisconnecting(otherNames) {
	var message = '> ' + otherNames.join(' and ');
	message += ' disconnected. '
	if (otherNames.length > 1) {
		message += 'What a bunch of ' + state.commonText + 's';
	} else {
		message += 'What a ' + state.commonText;
	}
	return message;
}


function meDisconnecting(otherNames, numSecrets) {
	var message = '> You';
	for (var i = 1; i < otherNames.length; i++) 
		message += ', ' + otherNames[i];
	if (otherNames.length > 0) 
		message += ' and ' + otherNames[0];
	message += ' disconnected. ';
	if (otherNames.length > 0) message += "Negotiate ";
	else                       message += "Choose ";
	if (numSecrets > 1)  message += numSecrets + " secrets to steal: "
	else                 message += "a secret to steal: ";
	return message;
}


function hackerPrompt() {
	var message = '> Hack the enemy agents and steal their secrets<br>> Hint: ';
	message += state.commonText.split('.')[0];
	message += '<br>><br>> Progress: <br>';
	return message;
}


var titleArt = "\
███████╗██╗  ██╗███████╗██╗██╗  ████████╗██████╗  █████╗ ████████╗███████╗\n\
██╔════╝╚██╗██╔╝██╔════╝██║██║  ╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝\n\
█████╗   ╚███╔╝ █████╗  ██║██║     ██║   ██████╔╝███████║   ██║   █████╗  \n\
██╔══╝   ██╔██╗ ██╔══╝  ██║██║     ██║   ██╔══██╗██╔══██║   ██║   ██╔══╝  \n\
███████╗██╔╝ ██╗██║     ██║███████╗██║   ██║  ██║██║  ██║   ██║   ███████╗\n\
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝\n\
\n\
[ Press Any Key ]";
document.getElementById('splash').innerHTML = titleArt;


var sourceCodeText = "\
use crate::syntaxtree as ST;\n\
use crate::interpreter;\n\
use interpreter::Instruction;\n\
#[derive(Default, Debug)]\n\
pub struct Code {\n\
    fwd: Vec<Instruction>,\n\
    bkwd: Vec<Instruction>,\n\
    f2b_links: Vec<(usize, usize)>,\n\
    b2f_links: Vec<(usize, usize)>\n\
}\n\
impl Code {\n\
    pub fn new() -> Code {\n\
        Default::default()\n\
    }\n\
    pub fn with_capacity(l1: usize, l2: usize) -> Code {\n\
        Code{\n\
            fwd: Vec::with_capacity(l1),\n\
            bkwd: Vec::with_capacity(l2),\n\
            f2b_links: Vec::new(),\n\
            b2f_links: Vec::new()\n\
        }\n\
    }\n\
    pub fn link_fwd2bkwd(&mut self) {\n\
        self.f2b_links.push((self.fwd.len(), self.bkwd.len()));\n\
        // Insert dummy instruction //\n\
        self.fwd.push(Instruction::Reverse{idx: 0});\n\
    }\n\
    pub fn link_bkwd2fwd(&mut self) {\n\
        self.b2f_links.push((self.bkwd.len(), self.fwd.len()));\n\
        // Insert dummy instruction //\n\
        self.bkwd.push(Instruction::Reverse{idx: 0});\n\
    }\n\
    pub fn push_fwd(&mut self, x: Instruction) {\n\
        self.fwd.push(x);\n\
    }\n\
    pub fn push_bkwd(&mut self, x: Instruction) {\n\
        self.bkwd.push(x);\n\
    }\n\
    pub fn append_fwd(&mut self, mut instructions: Vec<Instruction>) {\n\
        self.fwd.append(&mut instructions);\n\
    }\n\
    \n\
    pub fn append_bkwd(&mut self, instructions: Vec<Instruction>) {\n\
        self.bkwd.extend(instructions.into_iter().rev());\n\
    }\n\
    pub fn fwd_len(&mut self) -> usize {\n\
        self.fwd.len()\n\
    }\n\
    pub fn bkwd_len(&mut self) -> usize {\n\
        self.bkwd.len()\n\
    }\n\
    pub fn extend(&mut self, other: Code) {\n\
        let Code{fwd, bkwd, f2b_links, b2f_links} = other;\n\
        let (flen, blen) = (self.fwd.len(), self.bkwd.len());\n\
        self.fwd.extend(fwd);\n\
        self.bkwd.extend(bkwd);\n\
        for (f, b) in f2b_links.into_iter() {\n\
            self.f2b_links.push((f + flen, b + blen));\n\
        }\n\
        for (b, f) in b2f_links.into_iter() {\n\
            self.b2f_links.push((b + blen, f + flen));\n\
        }\n\
    }\n\
    pub fn finalise(code: Code) -> interpreter::Code {\n\
        let Code{mut fwd, mut bkwd, f2b_links, b2f_links} = code;\n\
        bkwd.reverse();\n\
        for (f, b) in f2b_links.into_iter() {\n\
            let b = bkwd.len() - b;\n\
            match fwd[f] {\n\
                Instruction::Reverse{idx: _} => fwd[f] = Instruction::Reverse{idx: b},\n\
                _ => panic!()\n\
            }\n\
        }\n\
        for (b, f) in b2f_links.into_iter() {\n\
            let b = bkwd.len() - b;\n\
            match bkwd[b] {\n\
                Instruction::Reverse{idx: _} => bkwd[b] = Instruction::Reverse{idx: f},\n\
                _ => panic!()\n\
            }\n\
        }\n\
        interpreter::Code{fwd, bkwd}\n\
    }\n\
}\n\
impl ST::ExpressionNode {\n\
    pub fn compile(&self) -> Vec<Instruction> {\n\
        match &self {\n\
            ST::ExpressionNode::FractionNode(valbox) => valbox.compile(),\n\
            ST::ExpressionNode::LookupNode(valbox) => valbox.compile(),\n\
            ST::ExpressionNode::BinopNode(valbox) => valbox.compile(),\n\
            ST::ExpressionNode::ArrayLiteralNode(valbox) => valbox.compile()\n\
        }\n\
    }\n\
}\n\
impl ST::FractionNode {\n\
    pub fn compile(&self) -> Vec<Instruction> {\n\
        vec![Instruction::LoadConst{idx: self.const_idx}]\n\
    }\n\
}\n\
impl ST::LookupNode {\n\
    pub fn compile(&self) -> Vec<Instruction> {\n\
        let mut instructions = Vec::with_capacity(self.indices.len()+1);        \n\
        for index in self.indices.iter().rev() {\n\
            instructions.extend(index.compile());\n\
        }\n\
        instructions.push(Instruction::LoadRegister{register:self.register});\n\
        if !self.indices.is_empty() {\n\
            instructions.push(Instruction::Subscript{size: self.indices.len()});\n\
        }\n\
        instructions\n\
    }\n\
}\n\
impl ST::BinopNode {\n\
    pub fn compile(&self) -> Vec<Instruction> {\n\
        let mut ret = Vec::new();\n\
        ret.extend(self.lhs.compile());\n\
        ret.extend(self.rhs.compile());\n\
        ret.push(self.op.clone());\n\
        ret\n\
    }\n\
}\n\
impl ST::ArrayLiteralNode {\n\
    pub fn compile(&self) -> Vec<Instruction> {\n\
        let mut ret = Vec::with_capacity(self.items.len() + 1);\n\
        for item in self.items.iter().rev() {\n\
            ret.extend(item.compile());\n\
        }\n\
        ret.push(Instruction::CreateArray{size: self.items.len()});\n\
        ret\n\
    }\n\
}\n\
impl ST::StatementNode {\n\
    pub fn compile(&self) -> Code {\n\
        match self {\n\
            ST::StatementNode::LetUnletNode(valbox) => valbox.compile(),\n\
            ST::StatementNode::RefUnrefNode(valbox) => valbox.compile(),\n\
            ST::StatementNode::IfNode(valbox) => valbox.compile(),\n\
            ST::StatementNode::ModopNode(valbox) => valbox.compile(),\n\
            ST::StatementNode::CatchNode(valbox) => valbox.compile(),\n\
            ST::StatementNode::CallNode(valbox) => valbox.compile()\n\
        }\n\
    }\n\
}\n\
impl ST::LetUnletNode {\n\
    pub fn compile(&self) -> Code {\n\
        let mut code = Code::new();\n\
        if self.is_unlet {\n\
            code.push_fwd(Instruction::FreeRegister{register: self.register});\n\
            code.push_bkwd(Instruction::StoreRegister{register: self.register});\n\
            code.push_bkwd(Instruction::UniqueVar);\n\
            code.append_bkwd(self.rhs.compile());\n\
        } else {\n\
            code.append_fwd(self.rhs.compile());\n\
            code.push_fwd(Instruction::UniqueVar);\n\
            code.push_fwd(Instruction::StoreRegister{register: self.register});\n\
            code.push_bkwd(Instruction::FreeRegister{register: self.register});\n\
        }\n\
        code\n\
    }\n\
}\n\
impl ST::RefUnrefNode {\n\
    pub fn compile(&self) -> Code {\n\
        let mut create_ref = self.rhs.compile();\n\
        create_ref.push(Instruction::StoreRegister{register: self.register});\n\
        let remove_ref = vec![Instruction::FreeRegister{register: self.register}];\n\
        let mut code = Code::new();\n\
        if self.is_unref{\n\
            code.append_fwd(remove_ref);\n\
            code.append_bkwd(create_ref);\n\
        } else {\n\
            code.append_fwd(create_ref);\n\
            code.append_bkwd(remove_ref);\n\
        }\n\
        code\n\
    }\n\
}\n\
impl ST::ModopNode {\n\
    pub fn compile(&self) -> Code {\n\
        let lookup = self.lookup.compile();\n\
        let rhs = self.rhs.compile();\n\
        let bkwd_op = match self.op {\n\
            Instruction::BinopAdd => Instruction::BinopSub,\n\
            Instruction::BinopSub => Instruction::BinopAdd,\n\
            Instruction::BinopMul => Instruction::BinopDiv,\n\
            Instruction::BinopDiv => Instruction::BinopMul,\n\
            _ => unreachable!()\n\
        };\n\
        let capacity = lookup.len() + rhs.len() + 3;\n\
        let mut code = Code::with_capacity(capacity, capacity);\n\
        code.append_fwd(lookup.clone());\n\
        code.push_fwd(Instruction::DuplicateRef);\n\
        code.append_fwd(rhs.clone());\n\
        code.push_fwd(self.op.clone());\n\
        code.push_fwd(Instruction::Store);\n\
        code.push_bkwd(Instruction::Store);\n\
        code.push_bkwd(bkwd_op);\n\
        code.append_bkwd(rhs);\n\
        code.push_bkwd(Instruction::DuplicateRef);\n\
        code.append_bkwd(lookup);\n\
        \n\
        code\n\
    }\n\
}\n\
impl ST::IfNode {\n\
    pub fn compile(&self) -> Code {\n\
        let fwd_expr = self.fwd_expr.compile();\n\
        let bkwd_expr = self.bkwd_expr.compile();\n\
        let mut if_block = Code::new();\n\
        for stmt in self.if_stmts.iter() {\n\
            if_block.extend(stmt.compile());\n\
        }\n\
        let mut else_block = Code::new();\n\
        for stmt in self.else_stmts.iter() {\n\
            else_block.extend(stmt.compile());\n\
        }\n\
        let if_bkwd_len = if_block.bkwd_len() as isize;\n\
        let else_bkwd_len = else_block.bkwd_len() as isize;\n\
        \n\
        let mut code = Code::with_capacity(\n\
            if_block.fwd_len() + else_block.fwd_len() + fwd_expr.len() + 2, \n\
            if_block.bkwd_len() + else_block.bkwd_len() + bkwd_expr.len() + 2);\n\
        \n\
        code.append_fwd(fwd_expr);\n\
        code.push_fwd(Instruction::JumpIfFalse{\n\
            delta: (if_block.fwd_len() + 1) as isize\n\
        });\n\
        code.extend(if_block);\n\
        code.push_fwd(Instruction::Jump{\n\
            delta: else_block.fwd_len() as isize\n\
        });\n\
        code.push_bkwd(Instruction::Jump{delta: if_bkwd_len});\n\
        code.extend(else_block);\n\
        code.push_bkwd(Instruction::JumpIfTrue{delta: else_bkwd_len + 1});\n\
        code.append_bkwd(bkwd_expr);\n\
        code\n\
    }\n\
}\n\
impl ST::CatchNode {\n\
    pub fn compile(&self) -> Code {\n\
        let mut code = Code::new();\n\
        code.append_fwd(self.expr.compile());\n\
        code.push_fwd(Instruction::JumpIfFalse{delta: 1});\n\
        code.link_fwd2bkwd();\n\
        code\n\
    }\n\
}\n\
impl ST::CallNode {\n\
    pub fn compile(&self) -> Code {\n\
        let mut code = Code::new();\n\
        for &register in self.stolen_args.iter().rev() {\n\
            code.push_fwd(Instruction::LoadRegister{register});\n\
            code.push_fwd(Instruction::FreeRegister{register});\n\
        }\n\
        if self.is_uncall {\n\
            code.push_bkwd(Instruction::Call{idx: self.func_idx});\n\
            code.push_fwd(Instruction::Uncall{idx: self.func_idx});\n\
        } else {\n\
            for arg in self.borrow_args.iter().rev() {\n\
                code.append_fwd(arg.compile());\n\
            }\n\
            code.push_fwd(Instruction::Call{idx: self.func_idx});\n\
            code.push_bkwd(Instruction::Uncall{idx: self.func_idx});\n\
        }\n\
        for &register in self.return_args.iter().rev() {\n\
            code.push_fwd(Instruction::StoreRegister{register});\n\
        }\n\
        code\n\
    }\n\
}\n\
impl ST::FunctionNode {\n\
    pub fn compile(&self) -> interpreter::Function {\n\
        let mut code = Code::new();\n\
        for &register in &self.borrow_registers {\n\
            code.push_fwd(Instruction::StoreRegister{register});\n\
        }\n\
        for &register in &self.steal_registers {\n\
            code.push_fwd(Instruction::StoreRegister{register});\n\
        }\n\
        for stmt in &self.stmts {\n\
            code.extend(stmt.compile());\n\
        }\n\
        for &register in &self.return_registers {\n\
            code.push_fwd(Instruction::LoadRegister{register});\n\
        }\n\
        interpreter::Function{\n\
            consts: self.consts.clone(),\n\
            code: Code::finalise(code),\n\
            num_registers: self.num_registers\n\
        }\n\
    }\n\
}\n\
impl ST::Module {\n\
    pub fn compile(&self) -> interpreter::Module {\n\
        interpreter::Module{\n\
            main_idx: self.main_idx,\n\
            functions: self.functions.iter()\n\
                                     .map(|f| f.compile())\n\
                                     .collect()\n\
        }\n\
    }\n\
}\n\
#include \"sched.h\"\n\
#include <trace/events/power.h>\n\
\n\
extern char __cpuidle_text_start[], __cpuidle_text_end[];\n\
void sched_idle_set_state(struct cpuidle_state *idle_state)\n\
{\n\
	idle_set_state(this_rq(), idle_state);\n\
}\n\
static int __read_mostly cpu_idle_force_poll;\n\
void cpu_idle_poll_ctrl(bool enable)\n\
{\n\
	if (enable) {\n\
		cpu_idle_force_poll++;\n\
	} else {\n\
		cpu_idle_force_poll--;\n\
		WARN_ON_ONCE(cpu_idle_force_poll < 0);\n\
	}\n\
}\n\
#ifdef CONFIG_GENERIC_IDLE_POLL_SETUP\n\
static int __init cpu_idle_poll_setup(char *__unused)\n\
{\n\
	cpu_idle_force_poll = 1;\n\
	return 1;\n\
}\n\
__setup(\"nohlt\", cpu_idle_poll_setup);\n\
static int __init cpu_idle_nopoll_setup(char *__unused)\n\
{\n\
	cpu_idle_force_poll = 0;\n\
	return 1;\n\
}\n\
__setup(\"hlt\", cpu_idle_nopoll_setup);\n\
#endif\n\
static noinline int __cpuidle cpu_idle_poll(void)\n\
{\n\
	rcu_idle_enter();\n\
	trace_cpu_idle_rcuidle(0, smp_processor_id());\n\
	local_irq_enable();\n\
	stop_critical_timings();\n\
	while (!tif_need_resched() &&\n\
		(cpu_idle_force_poll || tick_check_broadcast_expired()))\n\
		cpu_relax();\n\
	start_critical_timings();\n\
	trace_cpu_idle_rcuidle(PWR_EVENT_EXIT, smp_processor_id());\n\
	rcu_idle_exit();\n\
	return 1;\n\
}\n\
\n\
void __weak arch_cpu_idle_prepare(void) { }\n\
void __weak arch_cpu_idle_enter(void) { }\n\
void __weak arch_cpu_idle_exit(void) { }\n\
void __weak arch_cpu_idle_dead(void) { }\n\
void __weak arch_cpu_idle(void)\n\
{\n\
	cpu_idle_force_poll = 1;\n\
	local_irq_enable();\n\
}\n\
void __cpuidle default_idle_call(void)\n\
{\n\
	if (current_clr_polling_and_test()) {\n\
		local_irq_enable();\n\
	} else {\n\
		stop_critical_timings();\n\
		arch_cpu_idle();\n\
		start_critical_timings();\n\
	}\n\
}\n\
static int call_cpuidle(struct cpuidle_driver *drv, struct cpuidle_device *dev,\n\
		      int next_state)\n\
{\n\
	if (current_clr_polling_and_test()) {\n\
		dev->last_residency_ns = 0;\n\
		local_irq_enable();\n\
		return -EBUSY;\n\
	}\n\
	return cpuidle_enter(drv, dev, next_state);\n\
}\n\
static void cpuidle_idle_call(void)\n\
{\n\
	struct cpuidle_device *dev = cpuidle_get_device();\n\
	struct cpuidle_driver *drv = cpuidle_get_cpu_driver(dev);\n\
	int next_state, entered_state;\n\
	if (need_resched()) {\n\
		local_irq_enable();\n\
		return;\n\
	}\n\
	if (cpuidle_not_available(drv, dev)) {\n\
		tick_nohz_idle_stop_tick();\n\
		rcu_idle_enter();\n\
		default_idle_call();\n\
		goto exit_idle;\n\
	}\n\
	if (idle_should_enter_s2idle() || dev->forced_idle_latency_limit_ns) {\n\
		u64 max_latency_ns;\n\
		if (idle_should_enter_s2idle()) {\n\
			rcu_idle_enter();\n\
			entered_state = cpuidle_enter_s2idle(drv, dev);\n\
			if (entered_state > 0) {\n\
				local_irq_enable();\n\
				goto exit_idle;\n\
			}\n\
			rcu_idle_exit();\n\
			max_latency_ns = U64_MAX;\n\
		} else {\n\
			max_latency_ns = dev->forced_idle_latency_limit_ns;\n\
		}\n\
		tick_nohz_idle_stop_tick();\n\
		rcu_idle_enter();\n\
		next_state = cpuidle_find_deepest_state(drv, dev, max_latency_ns);\n\
		call_cpuidle(drv, dev, next_state);\n\
	} else {\n\
		bool stop_tick = true;\n\
		next_state = cpuidle_select(drv, dev, &stop_tick);\n\
		if (stop_tick || tick_nohz_tick_stopped())\n\
			tick_nohz_idle_stop_tick();\n\
		else\n\
			tick_nohz_idle_retain_tick();\n\
		rcu_idle_enter();\n\
		entered_state = call_cpuidle(drv, dev, next_state);\n\
		cpuidle_reflect(dev, entered_state);\n\
	}\n\
exit_idle:\n\
	__current_set_polling();\n\
	if (WARN_ON_ONCE(irqs_disabled()))\n\
		local_irq_enable();\n\
	rcu_idle_exit();\n\
}\n\
static void do_idle(void)\n\
{\n\
	int cpu = smp_processor_id();\n\
	__current_set_polling();\n\
	tick_nohz_idle_enter();\n\
	while (!need_resched()) {\n\
		rmb();\n\
		local_irq_disable();\n\
		if (cpu_is_offline(cpu)) {\n\
			tick_nohz_idle_stop_tick();\n\
			cpuhp_report_idle_dead();\n\
			arch_cpu_idle_dead();\n\
		}\n\
		arch_cpu_idle_enter();\n\
		if (cpu_idle_force_poll || tick_check_broadcast_expired()) {\n\
			tick_nohz_idle_restart_tick();\n\
			cpu_idle_poll();\n\
		} else {\n\
			cpuidle_idle_call();\n\
		}\n\
		arch_cpu_idle_exit();\n\
	}\n\
	preempt_set_need_resched();\n\
	tick_nohz_idle_exit();\n\
	__current_clr_polling();\n\
	smp_mb__after_atomic();\n\
	sched_ttwu_pending();\n\
	schedule_idle();\n\
	if (unlikely(klp_patch_pending(current)))\n\
		klp_update_patch_state(current);\n\
}\n\
bool cpu_in_idle(unsigned long pc)\n\
{\n\
	return pc >= (unsigned long)__cpuidle_text_start &&\n\
		pc < (unsigned long)__cpuidle_text_end;\n\
}\n\
struct idle_timer {\n\
	struct hrtimer timer;\n\
	int done;\n\
};\n\
static enum hrtimer_restart idle_inject_timer_fn(struct hrtimer *timer)\n\
{\n\
	struct idle_timer *it = container_of(timer, struct idle_timer, timer);\n\
	WRITE_ONCE(it->done, 1);\n\
	set_tsk_need_resched(current);\n\
	return HRTIMER_NORESTART;\n\
}\n\
void play_idle_precise(u64 duration_ns, u64 latency_ns)\n\
{\n\
	struct idle_timer it;\n\
	WARN_ON_ONCE(current->policy != SCHED_FIFO);\n\
	WARN_ON_ONCE(current->nr_cpus_allowed != 1);\n\
	WARN_ON_ONCE(!(current->flags & PF_KTHREAD));\n\
	WARN_ON_ONCE(!(current->flags & PF_NO_SETAFFINITY));\n\
	WARN_ON_ONCE(!duration_ns);\n\
	rcu_sleep_check();\n\
	preempt_disable();\n\
	current->flags |= PF_IDLE;\n\
	cpuidle_use_deepest_state(latency_ns);\n\
	it.done = 0;\n\
	hrtimer_init_on_stack(&it.timer, CLOCK_MONOTONIC, HRTIMER_MODE_REL);\n\
	it.timer.function = idle_inject_timer_fn;\n\
	hrtimer_start(&it.timer, ns_to_ktime(duration_ns),\n\
		      HRTIMER_MODE_REL_PINNED);\n\
	while (!READ_ONCE(it.done))\n\
		do_idle();\n\
	cpuidle_use_deepest_state(0);\n\
	current->flags &= ~PF_IDLE;\n\
	preempt_fold_need_resched();\n\
	preempt_enable();\n\
}\n\
EXPORT_SYMBOL_GPL(play_idle_precise);\n\
void cpu_startup_entry(enum cpuhp_state state)\n\
{\n\
	arch_cpu_idle_prepare();\n\
	cpuhp_online_idle(state);\n\
	while (1)\n\
		do_idle();\n\
}\n\
#ifdef CONFIG_SMP\n\
static int\n\
select_task_rq_idle(struct task_struct *p, int cpu, int sd_flag, int flags)\n\
{\n\
	return task_cpu(p); \n\
}\n\
static int\n\
balance_idle(struct rq *rq, struct task_struct *prev, struct rq_flags *rf)\n\
{\n\
	return WARN_ON_ONCE(1);\n\
}\n\
#endif\n\
static void check_preempt_curr_idle(struct rq *rq, struct task_struct *p, int flags)\n\
{\n\
	resched_curr(rq);\n\
}\n\
static void put_prev_task_idle(struct rq *rq, struct task_struct *prev)\n\
{\n\
}\n\
static void set_next_task_idle(struct rq *rq, struct task_struct *next, bool first)\n\
{\n\
	update_idle_core(rq);\n\
	schedstat_inc(rq->sched_goidle);\n\
}\n\
struct task_struct *pick_next_task_idle(struct rq *rq)\n\
{\n\
	struct task_struct *next = rq->idle;\n\
	set_next_task_idle(rq, next, true);\n\
	return next;\n\
}\n\
static void\n\
dequeue_task_idle(struct rq *rq, struct task_struct *p, int flags)\n\
{\n\
	raw_spin_unlock_irq(&rq->lock);\n\
	printk(KERN_ERR \"bad: scheduling from the idle thread!\n\");\n\
	dump_stack();\n\
	raw_spin_lock_irq(&rq->lock);\n\
}\n\
static void task_tick_idle(struct rq *rq, struct task_struct *curr, int queued)\n\
{\n\
}\n\
static void switched_to_idle(struct rq *rq, struct task_struct *p)\n\
{\n\
	BUG();\n\
}\n\
static void\n\
prio_changed_idle(struct rq *rq, struct task_struct *p, int oldprio)\n\
{\n\
	BUG();\n\
}\n\
static unsigned int get_rr_interval_idle(struct rq *rq, struct task_struct *task)\n\
{\n\
	return 0;\n\
}\n\
static void update_curr_idle(struct rq *rq)\n\
{\n\
}\n\
const struct sched_class idle_sched_class = {\n\
\
	.dequeue_task		= dequeue_task_idle,\n\
	.check_preempt_curr	= check_preempt_curr_idle,\n\
	.pick_next_task		= pick_next_task_idle,\n\
	.put_prev_task		= put_prev_task_idle,\n\
	.set_next_task          = set_next_task_idle,\n\
#ifdef CONFIG_SMP\n\
	.balance		= balance_idle,\n\
	.select_task_rq		= select_task_rq_idle,\n\
	.set_cpus_allowed	= set_cpus_allowed_common,\n\
#endif\n\
	.task_tick		= task_tick_idle,\n\
	.get_rr_interval	= get_rr_interval_idle,\n\
	.prio_changed		= prio_changed_idle,\n\
	.switched_to		= switched_to_idle,\n\
	.update_curr		= update_curr_idle,\n\
};";