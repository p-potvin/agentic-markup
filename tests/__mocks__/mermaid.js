module.exports = {
  default: {
    initialize: jest.fn(),
    render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' })
  }
};
