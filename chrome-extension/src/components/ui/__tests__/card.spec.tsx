import React from 'react';
import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  it('always includes the targetiq-card class', () => {
    const { container } = render(<Card>Content</Card>);
    const div = container.querySelector('div');
    expect(div).toHaveClass('targetiq-card');
  });
});
