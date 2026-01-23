import React from 'react';
import { render } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  it('always includes the targetiq-label class', () => {
    const { container } = render(<Label>Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('targetiq-label');
  });
});
