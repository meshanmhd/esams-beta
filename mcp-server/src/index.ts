#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_exams',
    description: 'Get all exams with optional filtering by status, date, or subject',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'],
          description: 'Filter by exam status'
        },
        date_from: {
          type: 'string',
          format: 'date',
          description: 'Filter exams from this date (YYYY-MM-DD)'
        },
        date_to: {
          type: 'string',
          format: 'date',
          description: 'Filter exams until this date (YYYY-MM-DD)'
        },
        subject: {
          type: 'string',
          description: 'Filter by subject name'
        }
      }
    }
  },
  {
    name: 'get_exam_details',
    description: 'Get detailed information about a specific exam including registrations and allocations',
    inputSchema: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'string',
          description: 'The ID of the exam to get details for'
        }
      },
      required: ['exam_id']
    }
  },
  {
    name: 'get_students',
    description: 'Get all students with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'Filter by specific student ID'
        },
        name: {
          type: 'string',
          description: 'Filter by student name (partial match)'
        }
      }
    }
  },
  {
    name: 'get_exam_halls',
    description: 'Get all exam halls with their capacity and seat information',
    inputSchema: {
      type: 'object',
      properties: {
        hall_id: {
          type: 'string',
          description: 'Filter by specific hall ID'
        }
      }
    }
  },
  {
    name: 'get_seat_allocations',
    description: 'Get seat allocations for a specific exam or student',
    inputSchema: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'string',
          description: 'Filter by exam ID'
        },
        student_id: {
          type: 'string',
          description: 'Filter by student ID'
        }
      }
    }
  },
  {
    name: 'get_attendance',
    description: 'Get attendance records for exams',
    inputSchema: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'string',
          description: 'Filter by exam ID'
        },
        student_id: {
          type: 'string',
          description: 'Filter by student ID'
        },
        status: {
          type: 'string',
          enum: ['present', 'absent', 'late'],
          description: 'Filter by attendance status'
        }
      }
    }
  },
  {
    name: 'create_exam',
    description: 'Create a new exam (admin only)',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Exam title'
        },
        subject: {
          type: 'string',
          description: 'Subject name'
        },
        exam_date: {
          type: 'string',
          format: 'date',
          description: 'Exam date (YYYY-MM-DD)'
        },
        start_time: {
          type: 'string',
          description: 'Start time (HH:MM)'
        },
        end_time: {
          type: 'string',
          description: 'End time (HH:MM)'
        },
        duration_minutes: {
          type: 'number',
          description: 'Exam duration in minutes'
        },
        hall_id: {
          type: 'string',
          description: 'Exam hall ID'
        },
        max_students: {
          type: 'number',
          description: 'Maximum number of students'
        },
        instructions: {
          type: 'string',
          description: 'Exam instructions'
        },
        created_by: {
          type: 'string',
          description: 'Admin user ID creating the exam'
        }
      },
      required: ['title', 'subject', 'exam_date', 'start_time', 'end_time', 'duration_minutes', 'hall_id', 'created_by']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'esams-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_exams': {
        let query = supabase
          .from('exams')
          .select(`
            *,
            hall:exam_halls(*),
            created_by_profile:profiles!exams_created_by_fkey(*)
          `);

        if (args.status) {
          query = query.eq('status', args.status);
        }
        if (args.date_from) {
          query = query.gte('exam_date', args.date_from);
        }
        if (args.date_to) {
          query = query.lte('exam_date', args.date_to);
        }
        if (args.subject) {
          query = query.ilike('subject', `%${args.subject}%`);
        }

        const { data, error } = await query.order('exam_date', { ascending: true });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_exam_details': {
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            hall:exam_halls(*),
            created_by_profile:profiles!exams_created_by_fkey(*)
          `)
          .eq('id', args.exam_id)
          .single();

        if (examError) throw examError;

        const { data: registrations, error: regError } = await supabase
          .from('exam_registrations')
          .select(`
            *,
            student:profiles(*)
          `)
          .eq('exam_id', args.exam_id);

        if (regError) throw regError;

        const { data: allocations, error: allocError } = await supabase
          .from('seat_allocations')
          .select(`
            *,
            student:profiles(*),
            seat:seats(*)
          `)
          .eq('exam_id', args.exam_id);

        if (allocError) throw allocError;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                exam,
                registrations,
                allocations,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_students': {
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (args.student_id) {
          query = query.eq('student_id', args.student_id);
        }
        if (args.name) {
          query = query.ilike('full_name', `%${args.name}%`);
        }

        const { data, error } = await query.order('full_name');

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_exam_halls': {
        let query = supabase
          .from('exam_halls')
          .select(`
            *,
            seats(*)
          `);

        if (args.hall_id) {
          query = query.eq('id', args.hall_id);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_seat_allocations': {
        let query = supabase
          .from('seat_allocations')
          .select(`
            *,
            exam:exams(*),
            student:profiles(*),
            seat:seats(*)
          `);

        if (args.exam_id) {
          query = query.eq('exam_id', args.exam_id);
        }
        if (args.student_id) {
          query = query.eq('student_id', args.student_id);
        }

        const { data, error } = await query.order('allocated_at', { ascending: false });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_attendance': {
        let query = supabase
          .from('exam_attendance')
          .select(`
            *,
            exam:exams(*),
            student:profiles(*),
            seat_allocation:seat_allocations(*)
          `);

        if (args.exam_id) {
          query = query.eq('exam_id', args.exam_id);
        }
        if (args.student_id) {
          query = query.eq('student_id', args.student_id);
        }
        if (args.status) {
          query = query.eq('status', args.status);
        }

        const { data, error } = await query.order('check_in_time', { ascending: false });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'create_exam': {
        const { data, error } = await supabase
          .from('exams')
          .insert([args])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ESAMS MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
