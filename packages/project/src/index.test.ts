import { describe, it, expect } from 'vitest';
import { ProjectManager, type ProjectInfo } from './index';

describe('Project Package', () => {
  it('should export ProjectManager class', () => {
    expect(ProjectManager).toBeDefined();
    expect(typeof ProjectManager).toBe('function');
  });

  it('should export ProjectInfo type', () => {
    const project: ProjectInfo = {
      name: 'test-project',
      type: 'cdktf',
      hasState: false,
      hasOutputs: false,
      workingDirectory: '/test/path'
    };
    expect(project).toBeDefined();
    expect(project.name).toBe('test-project');
  });

  it('should create ProjectManager instance', () => {
    const manager = new ProjectManager();
    expect(manager).toBeInstanceOf(ProjectManager);
  });

  it('should create ProjectManager with custom working directory', () => {
    const manager = new ProjectManager('/custom/path');
    expect(manager).toBeInstanceOf(ProjectManager);
  });
});
