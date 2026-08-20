import React, { useState } from 'react';
import { Play, Sliders, ToggleLeft, ToggleRight, ArrowRight, Mail, Key, RefreshCw } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import type { Workflow } from '../context/MockDbContext';
import {
  PageHeader,
  Breadcrumb,
  Button,
  Badge,
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell
} from '../components/ui';

export const Workflows: React.FC = () => {
  const { workflows, toggleWorkflow, simulateWorkflowTrigger } = useMockDb();

  // Selected workflow pointer
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Manual trigger logs
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleToggleActive = (w: Workflow) => {
    toggleWorkflow(w.id, !w.enabled);
  };

  const handleOpenDetails = (w: Workflow) => {
    setSelectedWorkflow(w);
    setSimulationLogs([]);
    setIsDetailsOpen(true);
  };

  const handleRunSimulation = () => {
    if (!selectedWorkflow) return;
    setIsSimulating(true);
    setSimulationLogs(['Initializing Automation Engine...']);

    // Step 1: Trigger Event
    setTimeout(() => {
      setSimulationLogs(prev => [...prev, `[TRIGGER] ${selectedWorkflow.triggerEvent}`]);
    }, 400);

    // Step 2: System Action
    setTimeout(() => {
      setSimulationLogs(prev => [...prev, `[SYSTEM ACTION] ${selectedWorkflow.systemAction}`]);
    }, 900);

    // Step 3: User Notification
    setTimeout(() => {
      setSimulationLogs(prev => [...prev, `[NOTIFICATION DISPATCHED] ${selectedWorkflow.userNotification}`]);
      setIsSimulating(false);
      // Increment execution counter in DB
      simulateWorkflowTrigger(selectedWorkflow.id);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Workflows Console"
        description="Build operational recipes. Hook trigger events to system actions and student dispatch notifications."
        breadcrumbs={<Breadcrumb items={[{ label: 'Operations' }, { label: 'Workflows' }]} />}
      />

      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 flex items-start gap-3.5 text-xs text-slate-400 leading-relaxed shadow-sm">
        <Sliders className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-350">Automation Automation Rules</span>
          <p>Workflows are triggered in real-time when CRM leads reach enrollment status, payments clear, or classes go live. Toggle active state to pause automatic mailers.</p>
        </div>
      </div>

      {/* Workflows table */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Workflow name</TableHeaderCell>
              <TableHeaderCell>Trigger Event</TableHeaderCell>
              <TableHeaderCell>System Action</TableHeaderCell>
              <TableHeaderCell>User Notification</TableHeaderCell>
              <TableHeaderCell>Executions</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map(wf => (
              <TableRow key={wf.id}>
                <TableCell className="font-bold text-slate-200">{wf.name}</TableCell>
                <TableCell>
                  <Badge variant="info" className="font-mono text-[10px]">
                    {wf.triggerEvent}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-xs font-semibold">{wf.systemAction}</TableCell>
                <TableCell className="text-slate-400 text-xs font-semibold">{wf.userNotification}</TableCell>
                <TableCell className="text-slate-300 font-mono font-bold text-xs">{wf.runCount} Runs</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggleActive(wf)}
                    className="cursor-pointer flex items-center gap-1 text-slate-400 hover:text-slate-200"
                    title="Click to toggle workflow"
                  >
                    {wf.enabled ? (
                      <ToggleRight className="h-6 w-6 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-700" />
                    )}
                    <span className="text-[10px] font-bold uppercase">{wf.enabled ? 'Active' : 'Inactive'}</span>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenDetails(wf)}>
                      Inspect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Play className="h-3 w-3 fill-current" />}
                      onClick={() => {
                        handleOpenDetails(wf);
                        // Delay slight to let modal open before running simulator
                        setTimeout(() => {
                          const btn = document.getElementById('run-sim-btn');
                          if (btn) btn.click();
                        }, 200);
                      }}
                    >
                      Test
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal: Workflow Inspector & Node visualizer */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => { if (!isSimulating) setIsDetailsOpen(false); }}
        title={`Inspect Workflow: ${selectedWorkflow?.name}`}
      >
        {selectedWorkflow && (
          <div className="space-y-6">
            {/* Visual Node Flow chart */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Execution Pipeline Flow</span>
              
              <div className="flex flex-col md:flex-row items-center gap-3.5 pt-1">
                {/* Node 1: Trigger */}
                <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 text-center w-full min-h-[90px] flex flex-col justify-center space-y-1">
                  <div className="p-1 bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 rounded-md w-max mx-auto">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trigger</span>
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">{selectedWorkflow.triggerEvent}</p>
                </div>

                <ArrowRight className="h-5 w-5 text-slate-700 hidden md:block shrink-0" />

                {/* Node 2: System Action */}
                <div className="flex-1 bg-slate-950 border border-slate-855 rounded-xl p-3 text-center w-full min-h-[90px] flex flex-col justify-center space-y-1">
                  <div className="p-1 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-md w-max mx-auto">
                    <Key className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Action</span>
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">{selectedWorkflow.systemAction}</p>
                </div>

                <ArrowRight className="h-5 w-5 text-slate-700 hidden md:block shrink-0" />

                {/* Node 3: Notification */}
                <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 text-center w-full min-h-[90px] flex flex-col justify-center space-y-1">
                  <div className="p-1 bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-md w-max mx-auto">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notification Dispatch</span>
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">{selectedWorkflow.userNotification}</p>
                </div>
              </div>
            </div>

            {/* Simulation Simulator */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-350 font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-indigo-400" /> Automation Simulator Run
                </span>
                <Button id="run-sim-btn" variant="secondary" size="sm" onClick={handleRunSimulation} disabled={isSimulating}>
                  {isSimulating ? 'Processing...' : 'Run Test Trigger'}
                </Button>
              </div>

              {/* Logs display */}
              {simulationLogs.length > 0 && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-855 font-mono text-[10px] space-y-1 max-h-[140px] overflow-y-auto leading-normal">
                  {simulationLogs.map((log, i) => (
                    <div key={i} className={log.startsWith('[TRIGGER]') ? 'text-indigo-400' : log.startsWith('[SYSTEM') ? 'text-emerald-400' : log.startsWith('[NOTIFICATION') ? 'text-amber-400' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))}
                  {isSimulating && (
                    <div className="text-indigo-500 animate-pulse flex items-center gap-1.5 mt-1 font-bold">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Processing next node...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)} disabled={isSimulating}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Workflows;
