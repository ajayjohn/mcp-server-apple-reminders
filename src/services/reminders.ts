
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
  isCompleted: boolean;
  priority: number;
  list: string; 
  creationDate?: string;
}

export class RemindersService {
  private async runCommand(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('remindctl', args);
      return stdout;
    } catch (error: any) {
      if (error.stderr) {
        throw new Error(`remindctl error: ${error.stderr.trim()}`);
      }
      throw error;
    }
  }

  async listReminders(listName: string): Promise<Reminder[]> {
    try {
        const output = await this.runCommand(['list', listName, '--json']);
        return JSON.parse(output);
    } catch (error) {
        console.error(`Error listing reminders for ${listName}:`, error);
        return [];
    }
  }

  async createReminder(title: string, list: string, due?: string, notes?: string): Promise<string> {
    const args = ['add', title, '--list', list];
    if (due) args.push('--due', due);
    if (notes) args.push('--notes', notes);
    
    // remindctl add usually returns the ID or a success message. 
    // Assuming for now it returns ID or we just return success.
    // The user requirements said: `remindctl add ...`
    const output = await this.runCommand(args);
    return output.trim();
  }

  async editReminder(id: string, title?: string, due?: string, notes?: string): Promise<string> {
    const args = ['edit', id];
    if (title) args.push('--title', title);
    if (due) args.push('--due', due);
    if (notes) args.push('--notes', notes);
    
    const output = await this.runCommand(args);
    return output.trim();
  }

  async completeReminder(id: string): Promise<string> {
    const output = await this.runCommand(['complete', id]);
    return output.trim();
  }

  async deleteReminder(id: string): Promise<string> {
    const output = await this.runCommand(['delete', id, '--force']);
    return output.trim();
  }
}
