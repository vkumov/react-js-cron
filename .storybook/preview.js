import 'antd/dist/antd.css'
import '../src/storybook-static/css/cui-standard.min.css'
import React from 'react'

export const decorators = [
  (Story) => (
    <div className='cui' style={{ overflow: 'visible' }}>
      <Story />
    </div>
  ),
]
