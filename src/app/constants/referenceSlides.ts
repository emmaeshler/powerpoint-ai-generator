// Import all reference slide images
import processFlowImg from '../../assets/3c8b9b7a83a1ce3cae5bc2aa24717e8ebf13ca7f.png';
import threeColImg from '../../assets/3b1cc0aac6cf4003d4f43185e4a84723cea3e8fb.png';
import directionProofImg from '../../assets/0e2190744bbaeda0f3e859aef216ddc8a8048a98.png';
import matrixTableImg from '../../assets/9c87234e06fcb87e0ec6ff37c19587444fa778ac.png';
import splitTableImg from '../../assets/2fd540fb339a91f78a5796f2117a5b18021a4637.png';
import threeColRowsImg from '../../assets/8d23751cc346d4932dfabdec911e7ccd32e98cc1.png';

export interface ReferenceSlide {
  id: string;
  label: string;
  description: string;
  imageBase64: string;
  imagePath?: string; // Optional Figma asset path
}

export const REFERENCE_SLIDES: ReferenceSlide[] = [
  {
    id: 'process_flow',
    label: 'Process Flow',
    description: 'Intent: "Here\'s How It Works in Sequence" — Sequential stages with arrows',
    imageBase64: '',
    imagePath: processFlowImg,
  },
  {
    id: 'three_col',
    label: 'Three Column',
    description: 'Intent: "These Are Different but Equal" — Parallel ideas with no hierarchy',
    imageBase64: '',
    imagePath: threeColImg,
  },
  {
    id: 'direction_proof',
    label: 'Direction + Proof',
    description: 'Intent: "One of These Matters More" — Hero element with supporting proof',
    imageBase64: '',
    imagePath: directionProofImg,
  },
  {
    id: 'matrix_table',
    label: 'Feature Matrix',
    description: 'Intent: "Compare Across Dimensions" — Multi-criteria comparison table',
    imageBase64: '',
    imagePath: matrixTableImg,
  },
  {
    id: 'split_table',
    label: 'Table + Chart (Evidence)',
    description: 'Intent: "Here\'s the Evidence" — Data visualization with context',
    imageBase64: '',
    imagePath: splitTableImg,
  },
  {
    id: 'prioritization',
    label: 'Prioritization Matrix',
    description: 'Intent: "What to Do First" — 2x2 matrix with impact vs effort',
    imageBase64: '',
    imagePath: threeColRowsImg,
  },
];