import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('always includes the targetiq-btn class', () => {
    const { container } = render(<Button>Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('targetiq-btn');
  });
});
