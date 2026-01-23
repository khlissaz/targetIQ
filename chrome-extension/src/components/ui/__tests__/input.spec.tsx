import React from 'react';
import { render } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('always includes the targetiq-input class', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('targetiq-input');
  });
});
