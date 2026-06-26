'use client';

import { useState } from 'react';

export default function KnifeThemeCustomizer() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [woodType, setWoodType] = useState<'walnut' | 'maple' | 'rosewood'>('walnut');
  const [bladeFinish, setBladeFinish] = useState<'standard' | 'damascus' | 'polished' | 'matte'>('standard');

  return (
    <div className="theme-customizer">
      <h3>Knife Navbar Customizer</h3>

      <div className="control-group">
        <label>Theme:</label>
        <div className="option-group">
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Wood Type:</label>
        <div className="option-group">
          <button
            className={woodType === 'walnut' ? 'active' : ''}
            onClick={() => setWoodType('walnut')}
          >
            Walnut
          </button>
          <button
            className={woodType === 'maple' ? 'active' : ''}
            onClick={() => setWoodType('maple')}
          >
            Maple
          </button>
          <button
            className={woodType === 'rosewood' ? 'active' : ''}
            onClick={() => setWoodType('rosewood')}
          >
            Rosewood
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Blade Finish:</label>
        <div className="option-group">
          <button
            className={bladeFinish === 'standard' ? 'active' : ''}
            onClick={() => setBladeFinish('standard')}
          >
            Standard
          </button>
          <button
            className={bladeFinish === 'damascus' ? 'active' : ''}
            onClick={() => setBladeFinish('damascus')}
          >
            Damascus
          </button>
          <button
            className={bladeFinish === 'polished' ? 'active' : ''}
            onClick={() => setBladeFinish('polished')}
          >
            Polished
          </button>
          <button
            className={bladeFinish === 'matte' ? 'active' : ''}
            onClick={() => setBladeFinish('matte')}
          >
            Matte
          </button>
        </div>
      </div>

      <div className="preview">
        <p>Apply these attributes to the knife-wrapper div:</p>
        <code>
          data-theme="{theme}" <br />
          data-wood-type="{woodType}" <br />
          data-blade-finish="{bladeFinish}"
        </code>
      </div>
    </div>
  );
}