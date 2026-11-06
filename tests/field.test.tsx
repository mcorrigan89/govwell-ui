import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

describe('FieldError', () => {
  it('shows a single error as plain text', () => {
    render(<FieldError errors={['Choose a station.']} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a station.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('reads string errors and schema issues alike, drops blanks and repeats, and lists several', () => {
    render(<FieldError errors={['Too short.', { message: 'Too short.' }, undefined, null, { message: 'No digits.' }, {}]} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Too short.', 'No digits.']);
  });

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<FieldError errors={[undefined, { message: '' }]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('prefers its children over errors', () => {
    render(<FieldError errors={['ignored']}>Custom message</FieldError>);
    expect(screen.getByRole('alert')).toHaveTextContent('Custom message');
  });
});

describe('Field', () => {
  it('labels its input, which takes typing', async () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="to">To</FieldLabel>
        <Input id="to" aria-invalid />
      </Field>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-invalid', 'true');
    const input = screen.getByLabelText('To');
    await userEvent.type(input, 'Coney Island');
    expect(input).toHaveValue('Coney Island');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
