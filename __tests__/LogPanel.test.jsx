import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import LogPanel from '../src/components/LogPanel.jsx';

describe('LogPanel', () => {
  test('Displays "No logs" message when array is empty.', () => {
    render(<LogPanel logs={[]} onClear={() => {}} loading={false} />);
    expect(screen.getByText('There are no logs to display yet...')).toBeInTheDocument();
    const toggle = screen.queryByRole('button', { name: /Close|Open/i });
    expect(toggle).toBeNull();
  });

  test('Displays logs when they exist.', () => {
    const logs = [{ ts: Date.now(), msg: 'Fetching A' }];
    render(<LogPanel logs={logs} onClear={() => {}} loading={false} />);
    expect(screen.getByText(/Fetching A/)).toBeInTheDocument();
  });

  test('Clean button calls for onClear', async () => {
    const onClear = vi.fn();
    const logs = [{ ts: Date.now(), msg: 'Hello' }];
    render(<LogPanel logs={logs} onClear={onClear} loading={false} />);
    await user.click(screen.getByRole('button', { name: 'Cleaning' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('Displays a loading indication when prop loading=true is sent.', () => {
    const logs = [{ ts: Date.now(), msg: 'Hello' }];
    render(<LogPanel logs={logs} onClear={() => {}} loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
